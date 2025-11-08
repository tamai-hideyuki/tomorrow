import { Memo } from './types';
import {
  selectDirectory as selectDirectoryFS,
  getDirectoryHandle as getDirectoryHandleFS,
  loadMemosFromDirectory,
  saveMemoToFile,
  deleteMemoFile,
  migrateFromLocalStorage as migrateFromLocalStorageFS,
} from './storage';

export interface MemoRepository {
  ensureDirectory(): Promise<boolean>;
  requestDirectory(): Promise<boolean>;

  loadAll(): Promise<Memo[]>;
  saveOne(memo: Memo): Promise<void>;
  deleteOne(memoId: string): Promise<void>;

  migrateFromLegacyStorage(): Promise<Memo[]>;
}

export class FileSystemMemoRepository implements MemoRepository {
  async ensureDirectory(): Promise<boolean> {
    const handle = await getDirectoryHandleFS();
    return handle !== null;
  }

  async requestDirectory(): Promise<boolean> {
    const handle = await selectDirectoryFS();
    return handle !== null;
  }

  async loadAll(): Promise<Memo[]> {
    return await loadMemosFromDirectory();
  }

  async saveOne(memo: Memo): Promise<void> {
    await saveMemoToFile(memo);
  }

  async deleteOne(memoId: string): Promise<void> {
    await deleteMemoFile(memoId);
  }

  async migrateFromLegacyStorage(): Promise<Memo[]> {
    return await migrateFromLocalStorageFS();
  }
}

export const memoRepository: MemoRepository = new FileSystemMemoRepository();
