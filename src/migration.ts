// =====[ L5: Migration & Validation Layer ]=========================================
// 役割: データの整合性チェックとスキーママイグレーション。
//       読み込み時に一度だけ実行し、不整合なデータを補正する。
// ポイント:
// - order フィールドが欠けている古いデータに order を追加
// - 将来的に zod などでスキーマバリデーションを実施
// - UI/状態層からは見えないようにし、repository 層から呼ぶ

import { Memo } from './types';

// order フィールドがない古いメモデータに order を付与
export function ensureOrderField(memos: Memo[]): Memo[] {
  const memosWithOrder = memos.map((memo, index) => {
    if (memo.order === undefined || memo.order === null) {
      return { ...memo, order: index };
    }
    return memo;
  });

  // order でソート
  memosWithOrder.sort((a, b) => a.order - b.order);

  return memosWithOrder;
}

// すべてのマイグレーションを適用
export function applyMigrations(memos: Memo[]): Memo[] {
  let result = memos;

  // マイグレーション1: order フィールドの付与
  result = ensureOrderField(result);

  // 将来的なマイグレーション:
  // - zod によるスキーマバリデーション
  // - タグフィールドの追加
  // - カテゴリ機能の追加
  // など

  return result;
}

// 新規メモの生成（デフォルト値を設定）
export function createNewMemo(order: number, partialMemo?: Partial<Memo>): Memo {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    title: `new memo ${order + 1}`,
    body: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    order,
    ...partialMemo,
  };
}

// 初期メモセットの生成（アプリ初回起動時用）
export function createInitialMemos(count: number = 2): Memo[] {
  return Array.from({ length: count }, (_, i) => createNewMemo(i));
}
