import { Memo } from './types';

export function ensureOrderField(memos: Memo[]): Memo[] {
  const memosWithOrder = memos.map((memo, index) => {
    if (memo.order === undefined || memo.order === null) {
      return { ...memo, order: index };
    }
    return memo;
  });

  memosWithOrder.sort((a, b) => a.order - b.order);

  return memosWithOrder;
}

export function applyMigrations(memos: Memo[]): Memo[] {
  let result = memos;

  result = ensureOrderField(result);

  return result;
}

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

export function createInitialMemos(count: number = 2): Memo[] {
  return Array.from({ length: count }, (_, i) => createNewMemo(i));
}
