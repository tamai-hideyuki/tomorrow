import { Hono } from 'hono';
import { memoRepository } from '../repository.js';
import { Memo, CreateMemoInput, UpdateMemoInput, ReorderInput } from '../types.js';

const app = new Hono();

// GET /api/memos - 全メモ取得
app.get('/', async (c) => {
  try {
    const memos = await memoRepository.loadAll();
    return c.json(memos);
  } catch (error) {
    console.error('メモ取得エラー:', error);
    return c.json({ error: 'メモの取得に失敗しました' }, 500);
  }
});

// GET /api/memos/:id - 単一メモ取得
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const memos = await memoRepository.loadAll();
    const memo = memos.find((m) => m.id === id);

    if (!memo) {
      return c.json({ error: 'メモが見つかりません' }, 404);
    }

    return c.json(memo);
  } catch (error) {
    console.error('メモ取得エラー:', error);
    return c.json({ error: 'メモの取得に失敗しました' }, 500);
  }
});

// POST /api/memos - 新規作成
app.post('/', async (c) => {
  try {
    const input = await c.req.json<CreateMemoInput>();
    const memos = await memoRepository.loadAll();

    const now = Date.now();
    const newMemo: Memo = {
      id: crypto.randomUUID(),
      title: input.title || '新規メモ',
      body: input.body || '',
      createdAt: now,
      updatedAt: now,
      order: memos.length,
    };

    await memoRepository.saveOne(newMemo);
    return c.json(newMemo, 201);
  } catch (error) {
    console.error('メモ作成エラー:', error);
    return c.json({ error: 'メモの作成に失敗しました' }, 500);
  }
});

// PUT /api/memos/:id - 更新
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const input = await c.req.json<UpdateMemoInput>();
    const memos = await memoRepository.loadAll();
    const memo = memos.find((m) => m.id === id);

    if (!memo) {
      return c.json({ error: 'メモが見つかりません' }, 404);
    }

    const updatedMemo: Memo = {
      ...memo,
      title: input.title !== undefined ? input.title : memo.title,
      body: input.body !== undefined ? input.body : memo.body,
      updatedAt: Date.now(),
    };

    await memoRepository.saveOne(updatedMemo);
    return c.json(updatedMemo);
  } catch (error) {
    console.error('メモ更新エラー:', error);
    return c.json({ error: 'メモの更新に失敗しました' }, 500);
  }
});

// DELETE /api/memos/:id - 削除
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const memos = await memoRepository.loadAll();
    const memo = memos.find((m) => m.id === id);

    if (!memo) {
      return c.json({ error: 'メモが見つかりません' }, 404);
    }

    await memoRepository.deleteOne(id);
    return c.json({ success: true });
  } catch (error) {
    console.error('メモ削除エラー:', error);
    return c.json({ error: 'メモの削除に失敗しました' }, 500);
  }
});

// PUT /api/memos/reorder - 順序変更
app.put('/reorder', async (c) => {
  try {
    const input = await c.req.json<ReorderInput>();
    const memos = await memoRepository.loadAll();

    const orderedMemos = input.orderedIds
      .map((id, index) => {
        const memo = memos.find((m) => m.id === id);
        if (memo) {
          return { ...memo, order: index };
        }
        return null;
      })
      .filter((m): m is Memo => m !== null);

    for (const memo of orderedMemos) {
      await memoRepository.saveOne(memo);
    }

    return c.json(orderedMemos);
  } catch (error) {
    console.error('メモ並び替えエラー:', error);
    return c.json({ error: 'メモの並び替えに失敗しました' }, 500);
  }
});

export default app;
