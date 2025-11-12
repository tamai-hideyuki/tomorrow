import { Memo } from './types';

let directoryHandle: FileSystemDirectoryHandle | null = null;

export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker();
    directoryHandle = handle;

    await saveDirectoryHandle(handle);
    return handle;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('フォルダ選択エラー:', error);
    }
    return null;
  }
}

//問題: saveDirectoryHandle が使用されていない
//影響: デッドコード
async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  localStorage.setItem('memo-directory-name', handle.name);
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (directoryHandle) {
    return directoryHandle;
  }
  return null;
}

export async function saveMemoToFile(memo: Memo): Promise<void> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    throw new Error('フォルダが選択されていません');
  }

  const fileName = `${memo.id}.md`;
  const fileHandle = await handle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  const content = `---
id: "${memo.id}"
title: "${escapeYaml(memo.title)}"
createdAt: ${memo.createdAt}
updatedAt: ${memo.updatedAt}
order: ${memo.order}
---
${memo.body}`;

  await writable.write(content);
  await writable.close();
}

export async function deleteMemoFile(memoId: string): Promise<void> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    throw new Error('フォルダが選択されていません');
  }

  const fileName = `${memoId}.md`;
  await handle.removeEntry(fileName, { recursive: false });
}

export async function loadMemosFromDirectory(): Promise<Memo[]> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return [];
  }

  const memos: Memo[] = [];
  //問題: as any as AsyncIterable で型安全性を損なっている
  //影響: 型チェックが機能せず、実行時エラーのリスク
  try {
    for await (const [name, entry] of handle as any as AsyncIterable<[string, FileSystemHandle]>) {
      if (entry.kind === 'file' && name.endsWith('.md')) {
        try {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();
          const memo = parseMarkdownFile(content, name);
          if (memo) {
            memos.push(memo);
          }
          //問題: alert() の使用、サイレントエラー
          //影響: UXの低下、エラーの見逃し
          //改善案: エラー状態管理、トースト通知の実装
        } catch (error) {
          console.error(`ファイル読み込みエラー: ${name}`, error);
        }
      }
    }
  } catch (error) {
    console.error('ディレクトリ読み込みエラー:', error);
  }

  memos.sort((a, b) => a.order - b.order);
  return memos;
}

function parseMarkdownFile(content: string, fileName: string): Memo | null {
  try {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatterMatch) {
      return null;
    }

    const frontMatter = frontMatterMatch[1];
    const body = frontMatterMatch[2];
    const idMatch = frontMatter.match(/^id:\s*"([^"]+)"/m);
    const titleMatch = frontMatter.match(/^title:\s*"([^"]+)"/m);
    const createdAtMatch = frontMatter.match(/^createdAt:\s*(\d+)/m);
    const updatedAtMatch = frontMatter.match(/^updatedAt:\s*(\d+)/m);
    const orderMatch = frontMatter.match(/^order:\s*(\d+)/m);

    if (!idMatch || !titleMatch || !createdAtMatch || !updatedAtMatch || !orderMatch) {
      return null;
    }

    return {
      id: idMatch[1],
      title: unescapeYaml(titleMatch[1]),
      body: body,
      createdAt: parseInt(createdAtMatch[1], 10),
      updatedAt: parseInt(updatedAtMatch[1], 10),
      order: parseInt(orderMatch[1], 10),
    };
  } catch (error) {
    console.error('Markdownパースエラー:', error);
    return null;
  }
}

function escapeYaml(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function unescapeYaml(str: string): string {
  return str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

export async function migrateFromLocalStorage(): Promise<Memo[]> {
  const STORAGE_KEY = 'memos';
  const data = localStorage.getItem(STORAGE_KEY);
  if (data === null) {
    return [];
  }

  try {
    const memos: Memo[] = JSON.parse(data);
    const handle = await getDirectoryHandle();
    if (!handle) {
      return memos;
    }

    for (const memo of memos) {
      await saveMemoToFile(memo);
    }

    localStorage.removeItem(STORAGE_KEY);
    return memos;
  } catch (error) {
    console.error('移行エラー:', error);
    return [];
  }
}
