import { useState, useEffect, useCallback } from 'react';
import { Memo } from './types';
import { memoRepository } from './repository';
import { applyMigrations, createNewMemo, createInitialMemos } from './migration';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

export type AppStatus = 'loading' | 'needDirectory' | 'ready';

export type UseMemosReturn = {
  memos: Memo[];
  selectedMemoId: string | undefined;
  isEditMode: boolean;
  status: AppStatus;

  selectDirectory: () => Promise<void>;
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

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setStatus('loading');

    const hasDirectory = await memoRepository.ensureDirectory();

    if (hasDirectory) {
      await loadMemos();
      setStatus('ready');
    } else {
      const migratedMemos = await memoRepository.migrateFromLegacyStorage();

      if (migratedMemos.length > 0) {
        const processedMemos = applyMigrations(migratedMemos);
        setMemos(processedMemos);
        setSelectedMemoId(processedMemos[0]?.id);
        setStatus('needDirectory');
      } else {
        const initialMemos = createInitialMemos();
        setMemos(initialMemos);
        setSelectedMemoId(initialMemos[0]?.id);
        setStatus('needDirectory');
      }
    }
  };

  const loadMemos = async () => {
    try {
      let loadedMemos = await memoRepository.loadAll();

      if (loadedMemos.length === 0) {
        const initialMemos = createInitialMemos();
        for (const memo of initialMemos) {
          await memoRepository.saveOne(memo);
        }
        loadedMemos = initialMemos;
      } else {
        loadedMemos = applyMigrations(loadedMemos);
      }

      setMemos(loadedMemos);
      setSelectedMemoId(loadedMemos[0]?.id);
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      toast.error('メモの読み込みに失敗しました');
    }
  };

  const debouncedSave = useDebouncedCallback(async (memos: Memo[]) => {
    for (const memo of memos) {
      await memoRepository.saveOne(memo);
    }
  }, 1000);

  useEffect(() => {
    if (memos.length > 0 && status === 'ready') {
      debouncedSave(memos);
    }
  }, [memos, status]);

  const selectDirectory = useCallback(async () => {
    const success = await memoRepository.requestDirectory();
    if (success) {
      await loadMemos();
      setStatus('ready');
    }
  }, [loadMemos]);

  const addMemo = useCallback(async () => {
    if (status !== 'ready') {
      alert('まずフォルダを選択してください');
      return;
    }

    const newMemo = createNewMemo(memos.length);
    const updatedMemos = [...memos, newMemo];
    setMemos(updatedMemos);
    setSelectedMemoId(newMemo.id);
    setIsEditMode(true);
  }, [memos, status]);

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
  }, []);

  const deleteMemo = useCallback(
    async (memoId: string) => {
      if (memos.length === 1) {
        alert('これ以上削除できません。');
        return;
      }

      try {
        await memoRepository.deleteOne(memoId);
      } catch (error) {
        console.error('ファイル削除エラー:', error);
        alert('ファイルの削除に失敗しました');
        return;
      }

      const reassignOrders = (memos: Memo[]) =>
        memos.map((memo, index) => ({
          ...memo,
          order: index,
        }));

      const newMemos = reassignOrders(memos.filter((memo) => memo.id !== memoId));

      const deletedIndex = memos.findIndex((m) => m.id === memoId);
      const newSelectedIndex = Math.max(0, deletedIndex - 1);
      const newSelectedId = newMemos[newSelectedIndex]?.id;

      setMemos(newMemos);
      setSelectedMemoId(newSelectedId);
      setIsEditMode(false);
    },
    [memos]
  );

  const reorderMemos = useCallback((dragIndex: number, dropIndex: number) => {
    setMemos((prevMemos) => {
      const reordered = [...prevMemos];

      const [draggedMemo] = reordered.splice(dragIndex, 1);

      reordered.splice(dropIndex, 0, draggedMemo);

      return reordered.map((memo, index) => ({
        ...memo,
        order: index,
      }));
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
    selectDirectory,
    addMemo,
    selectMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
    toggleEditMode,
  };
}
