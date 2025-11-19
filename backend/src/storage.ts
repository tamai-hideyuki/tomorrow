import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Memo } from './types.js';

const MEMOS_DIR = join(process.cwd(), '..', 'memos');

export async function ensureDirectory(): Promise<void> {
  if (!existsSync(MEMOS_DIR)) {
    await mkdir(MEMOS_DIR, { recursive: true });
  }
}

export async function saveMemoToFile(memo: Memo): Promise<void> {
  await ensureDirectory();

  const fileName = `${memo.id}.md`;
  const filePath = join(MEMOS_DIR, fileName);

  const content = `---
id: "${memo.id}"
title: "${escapeYaml(memo.title)}"
createdAt: ${memo.createdAt}
updatedAt: ${memo.updatedAt}
order: ${memo.order}
---
${memo.body}`;

  await writeFile(filePath, content, 'utf-8');
}

export async function deleteMemoFile(memoId: string): Promise<void> {
  const fileName = `${memoId}.md`;
  const filePath = join(MEMOS_DIR, fileName);

  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

export async function loadMemosFromDirectory(): Promise<Memo[]> {
  await ensureDirectory();

  const memos: Memo[] = [];

  try {
    const files = await readdir(MEMOS_DIR);

    for (const fileName of files) {
      if (fileName.endsWith('.md')) {
        try {
          const filePath = join(MEMOS_DIR, fileName);
          const content = await readFile(filePath, 'utf-8');
          const memo = parseMarkdownFile(content, fileName);
          if (memo) {
            memos.push(memo);
          }
        } catch (error) {
          console.error(`ファイル読み込みエラー: ${fileName}`, error);
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
