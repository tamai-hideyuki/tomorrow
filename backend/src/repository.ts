import { Memo } from './types.js';
import {
  loadMemosFromDirectory,
  saveMemoToFile,
  deleteMemoFile,
} from './storage.js';

export type MemoRepository = {
  loadAll(): Promise<Memo[]>;
  saveOne(memo: Memo): Promise<void>;
  deleteOne(memoId: string): Promise<void>;
};

export class FileSystemMemoRepository implements MemoRepository {
  async loadAll(): Promise<Memo[]> {
    return await loadMemosFromDirectory();
  }

  async saveOne(memo: Memo): Promise<void> {
    await saveMemoToFile(memo);
  }

  async deleteOne(memoId: string): Promise<void> {
    await deleteMemoFile(memoId);
  }
}

export const memoRepository: MemoRepository = new FileSystemMemoRepository();
