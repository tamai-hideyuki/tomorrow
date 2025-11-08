// =====[ L4: Persistence Layer ]====================================================
// 役割: データの永続化を抽象化。File System Access API や LocalStorage の
//       実装詳細をこの層に閉じ込め、上位層（useMemos）には統一インターフェースを提供。
// ポイント:
// - MemoRepository インターフェースで操作を定義
// - FileSystemRepository が実装（storage.ts を内部で使用）
// - 将来的に LocalStorageRepository や CloudRepository などを追加可能

import { Memo } from './types';
import {
  selectDirectory as selectDirectoryFS,
  getDirectoryHandle as getDirectoryHandleFS,
  loadMemosFromDirectory,
  saveMemoToFile,
  deleteMemoFile,
  migrateFromLocalStorage as migrateFromLocalStorageFS,
} from './storage';

// リポジトリインターフェース
export interface MemoRepository {
  // ディレクトリ操作
  ensureDirectory(): Promise<boolean>; // 既存のハンドルがあるか確認
  requestDirectory(): Promise<boolean>; // ユーザーにディレクトリ選択を要求

  // CRUD操作
  loadAll(): Promise<Memo[]>;
  saveOne(memo: Memo): Promise<void>;
  deleteOne(memoId: string): Promise<void>;

  // マイグレーション
  migrateFromLegacyStorage(): Promise<Memo[]>;
}

// File System Access API を使った実装
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

// デフォルトのリポジトリインスタンス（シングルトン）
export const memoRepository: MemoRepository = new FileSystemMemoRepository();
