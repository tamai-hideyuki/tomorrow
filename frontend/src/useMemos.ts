import { useState, useEffect, useCallback } from 'react';
import { Memo } from './types';
import { getBFF } from './api/getBFF';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

export type AppStatus = 'loading' | 'ready' | 'error';

export type UseMemosReturn = {
  memos: Memo[];
  selectedMemoId: string | undefined;
  isEditMode: boolean;
  status: AppStatus;

  addMemo: () => Promise<void>;
  selectMemo: (memoId: string) => void;
  updateMemo: (memoId: string, title: string, body: string) => void;
  deleteMemo: (memoId: string) => Promise<void>;
  reorderMemos: (dragIndex: number, dropIndex: number) => void;
  toggleEditMode: () => void;
};

export function useMemos(): UseMemosReturn {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [status, setStatus] = useState<AppStatus>('loading');
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { title: string; body: string }>>(
    new Map()
  );

  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = async () => {
    setStatus('loading');
    try {
      let loadedMemos = await getBFF.memos.getAll();

      if (loadedMemos.length === 0) {
        const newMemo = await getBFF.memos.create({
          title: 'はじめてのメモ',
          body: 'ここにメモを書きます。',
        });
        loadedMemos = [newMemo];
      }

      setMemos(loadedMemos);
      setSelectedMemoId(loadedMemos[0]?.id);
      setStatus('ready');
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      toast.error('メモの読み込みに失敗しました');
      setStatus('error');
    }
  };

  const debouncedSave = useDebouncedCallback(async (updates: Map<string, { title: string; body: string }>) => {
    for (const [memoId, { title, body }] of updates) {
      try {
        await getBFF.memos.update(memoId, { title, body });
      } catch (error) {
        console.error('メモ保存エラー:', error);
        toast.error('メモの保存に失敗しました');
      }
    }
    setPendingUpdates(new Map());
  }, 1000);

  useEffect(() => {
    if (pendingUpdates.size > 0 && status === 'ready') {
      debouncedSave(pendingUpdates);
    }
  }, [pendingUpdates, status]);

  const addMemo = useCallback(async () => {
    try {
      const newMemo = await getBFF.memos.create({
        title: '新規メモ',
        body: '',
      });
      setMemos((prev) => [...prev, newMemo]);
      setSelectedMemoId(newMemo.id);
      setIsEditMode(true);
    } catch (error) {
      console.error('メモ作成エラー:', error);
      toast.error('メモの作成に失敗しました');
    }
  }, []);

  const selectMemo = useCallback((memoId: string) => {
    setSelectedMemoId(memoId);
    setIsEditMode(false);
  }, []);

  const updateMemo = useCallback((memoId: string, title: string, body: string) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId ? { ...memo, title, body, updatedAt: Date.now() } : memo
      )
    );
    setPendingUpdates((prev) => {
      const newUpdates = new Map(prev);
      newUpdates.set(memoId, { title, body });
      return newUpdates;
    });
  }, []);

  const deleteMemo = useCallback(
    async (memoId: string) => {
      if (memos.length === 1) {
        toast.error('これ以上削除できません。');
        return;
      }

      try {
        await getBFF.memos.delete(memoId);
      } catch (error) {
        console.error('メモ削除エラー:', error);
        toast.error('メモの削除に失敗しました');
        return;
      }

      const newMemos = memos
        .filter((memo) => memo.id !== memoId)
        .map((memo, index) => ({
          ...memo,
          order: index,
        }));

      const deletedIndex = memos.findIndex((m) => m.id === memoId);
      const newSelectedIndex = Math.max(0, deletedIndex - 1);
      const newSelectedId = newMemos[newSelectedIndex]?.id;

      setMemos(newMemos);
      setSelectedMemoId(newSelectedId);
      setIsEditMode(false);
    },
    [memos]
  );

  const reorderMemos = useCallback(async (dragIndex: number, dropIndex: number) => {
    setMemos((prevMemos) => {
      const reordered = [...prevMemos];
      const [draggedMemo] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, draggedMemo);

      const updatedMemos = reordered.map((memo, index) => ({
        ...memo,
        order: index,
      }));

      // APIに並び順を保存
      const orderedIds = updatedMemos.map((m) => m.id);
      getBFF.memos.reorder(orderedIds).catch((error) => {
        console.error('並び替え保存エラー:', error);
        toast.error('並び替えの保存に失敗しました');
      });

      return updatedMemos;
    });
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  return {
    memos,
    selectedMemoId,
    isEditMode,
    status,
    addMemo,
    selectMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
    toggleEditMode,
  };
}
