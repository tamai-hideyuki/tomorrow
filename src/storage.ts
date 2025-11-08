import { Memo } from "./types";

// ファイルシステムのハンドルを保存（セッション間で保持するため）
let directoryHandle: FileSystemDirectoryHandle | null = null;

// フォルダを選択してハンドルを取得
export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    // @ts-ignore - File System Access APIの型定義
    const handle = await window.showDirectoryPicker();
    directoryHandle = handle;
    // ハンドルをlocalStorageに保存（パーミッションの永続化）
    await saveDirectoryHandle(handle);
    return handle;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('フォルダ選択エラー:', error);
    }
    return null;
  }
}

// ディレクトリハンドルをlocalStorageに保存（パーミッションの永続化）
async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  // IndexedDBに保存する方が良いが、簡易的にlocalStorageに名前だけ保存
  localStorage.setItem('memo-directory-name', handle.name);
}

// 保存済みのディレクトリハンドルを取得
export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (directoryHandle) {
    return directoryHandle;
  }
  // 以前に選択したフォルダを再取得（ユーザーが再度許可する必要がある）
  return null;
}

// メモをMarkdownファイルとして保存
export async function saveMemoToFile(memo: Memo): Promise<void> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    throw new Error('フォルダが選択されていません');
  }

  const fileName = `${memo.id}.md`;
  const fileHandle = await handle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  // フロントマター付きMarkdown形式で保存
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

// メモファイルを削除
export async function deleteMemoFile(memoId: string): Promise<void> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    throw new Error('フォルダが選択されていません');
  }

  const fileName = `${memoId}.md`;
  await handle.removeEntry(fileName, { recursive: false });
}

// フォルダ内の全メモを読み込む
export async function loadMemosFromDirectory(): Promise<Memo[]> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return [];
  }

  const memos: Memo[] = [];
  
  // フォルダ内の全ファイルを取得
  // FileSystemDirectoryHandleはAsyncIterableとして実装されている
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
        } catch (error) {
          console.error(`ファイル読み込みエラー: ${name}`, error);
        }
      }
    }
  } catch (error) {
    console.error('ディレクトリ読み込みエラー:', error);
    // エラーが発生しても空配列を返すか、既存のメモを返す
  }

  // order順にソート
  memos.sort((a, b) => a.order - b.order);
  return memos;
}

// MarkdownファイルをパースしてMemoオブジェクトに変換
function parseMarkdownFile(content: string, fileName: string): Memo | null {
  try {
    // フロントマターを抽出
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatterMatch) {
      return null;
    }

    const frontMatter = frontMatterMatch[1];
    const body = frontMatterMatch[2];

    // YAMLフロントマターをパース（簡易版）
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

// YAMLのエスケープ処理
function escapeYaml(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

// YAMLのアンエスケープ処理
function unescapeYaml(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// 後方互換性のため、localStorageから移行する関数
export async function migrateFromLocalStorage(): Promise<Memo[]> {
  const STORAGE_KEY = "memos";
  const data = localStorage.getItem(STORAGE_KEY);
  if (data === null) {
    return [];
  }

  try {
    const memos: Memo[] = JSON.parse(data);
    const handle = await getDirectoryHandle();
    if (!handle) {
      return memos; // フォルダが選択されていない場合はlocalStorageのデータを返す
    }

    // 全メモをファイルに保存
    for (const memo of memos) {
      await saveMemoToFile(memo);
    }

    // 移行完了後、localStorageをクリア
    localStorage.removeItem(STORAGE_KEY);
    return memos;
  } catch (error) {
    console.error('移行エラー:', error);
    return [];
  }
}
