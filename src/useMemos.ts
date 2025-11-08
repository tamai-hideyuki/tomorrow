// =====[ L2 + L3: App State & Domain Actions ]======================================
// 役割: メモアプリの状態管理とドメインロジックを集約したカスタムフック。
//       UI（App.tsx）からはこのフックを呼ぶだけで、すべての操作が可能になる。
// ポイント:
// - 状態: memos, selectedMemoId, isEditMode, status (loading/needDirectory/ready)
// - アクション: add/select/update/delete/reorder/selectDirectory
// - 保存処理: useEffect で自動保存（将来的に debounce + キュー化）
// - 初期化: useEffect で ensureDirectory → loadAll → applyMigrations

import { useState, useEffect, useCallback } from 'react';
import { Memo } from './types';
import { memoRepository } from './repository';
import { applyMigrations, createNewMemo, createInitialMemos } from './migration';

// アプリの状態型
export type AppStatus = 'loading' | 'needDirectory' | 'ready';

export interface UseMemosReturn {
  // 状態
  memos: Memo[];
  selectedMemoId: string | undefined;
  isEditMode: boolean;
  status: AppStatus;

  // アクション
  selectDirectory: () => Promise<void>;
  addMemo: () => Promise<void>;
  selectMemo: (memoId: string) => void;
  updateMemo: (memoId: string, title: string, body: string) => void;
  deleteMemo: (memoId: string) => Promise<void>;
  reorderMemos: (dragIndex: number, dropIndex: number) => void;
  toggleEditMode: () => void;
}

export function useMemos(): UseMemosReturn {
  // =====[ L2: State ]===============================================================
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [status, setStatus] = useState<AppStatus>('loading');

  // =====[ 初期化 ]==================================================================
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setStatus('loading');

    // L4: ディレクトリハンドルの確認
    const hasDirectory = await memoRepository.ensureDirectory();

    if (hasDirectory) {
      // ディレクトリが既に選択されている場合
      await loadMemos();
      setStatus('ready');
    } else {
      // ディレクトリが未選択 → localStorage からマイグレーションを試みる
      const migratedMemos = await memoRepository.migrateFromLegacyStorage();

      if (migratedMemos.length > 0) {
        // マイグレーション成功
        const processedMemos = applyMigrations(migratedMemos);
        setMemos(processedMemos);
        setSelectedMemoId(processedMemos[0]?.id);
        setStatus('needDirectory'); // まだディレクトリ選択が必要
      } else {
        // 初回起動 or データなし → 初期メモを作成
        const initialMemos = createInitialMemos();
        setMemos(initialMemos);
        setSelectedMemoId(initialMemos[0]?.id);
        setStatus('needDirectory');
      }
    }
  };

  // =====[ L4: データ読み込み ]=======================================================
  const loadMemos = async () => {
    try {
      let loadedMemos = await memoRepository.loadAll();

      if (loadedMemos.length === 0) {
        // メモが存在しない場合、初期メモを作成して保存
        const initialMemos = createInitialMemos();
        for (const memo of initialMemos) {
          await memoRepository.saveOne(memo);
        }
        loadedMemos = initialMemos;
      } else {
        // L5: マイグレーション適用
        loadedMemos = applyMigrations(loadedMemos);
      }

      setMemos(loadedMemos);
      setSelectedMemoId(loadedMemos[0]?.id);
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      alert('メモの読み込みに失敗しました');
    }
  };

  // =====[ L4: 自動保存 ]============================================================
  // メモが更新されたら自動的に全件保存（将来的に差分保存+debounce化）
  useEffect(() => {
    if (memos.length > 0 && status === 'ready') {
      saveAllMemos();
    }
  }, [memos, status]);

  const saveAllMemos = async () => {
    try {
      // TODO: ここを debounce + 保存キュー + mutex による直列化に変更
      for (const memo of memos) {
        await memoRepository.saveOne(memo);
      }
    } catch (error) {
      console.error('メモ保存エラー:', error);
      alert('メモの保存に失敗しました');
    }
  };

  // =====[ L3: Domain Actions ]======================================================

  // ディレクトリ選択アクション
  const selectDirectory = useCallback(async () => {
    const success = await memoRepository.requestDirectory();
    if (success) {
      await loadMemos();
      setStatus('ready');
    }
  }, []);

  // メモ追加アクション
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

  // メモ選択アクション
  const selectMemo = useCallback((memoId: string) => {
    setSelectedMemoId(memoId);
    setIsEditMode(false);
  }, []);

  // メモ更新アクション
  const updateMemo = useCallback((memoId: string, title: string, body: string) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? { ...memo, title, body, updatedAt: Date.now() }
          : memo
      )
    );
  }, []);

  // メモ削除アクション
  const deleteMemo = useCallback(async (memoId: string) => {
    if (memos.length === 1) {
      alert('これ以上削除できません。');
      return;
    }

    // L4: ファイル削除
    try {
      await memoRepository.deleteOne(memoId);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      alert('ファイルの削除に失敗しました');
      return;
    }

    // 削除後のメモリストを再構築
    const newMemos = memos.filter((memo) => memo.id !== memoId);
    newMemos.forEach((memo, index) => {
      memo.order = index;
    });

    // 選択中のメモを調整
    const deletedIndex = memos.findIndex((m) => m.id === memoId);
    const newSelectedIndex = Math.max(0, deletedIndex - 1);
    const newSelectedId = newMemos[newSelectedIndex]?.id;

    setMemos(newMemos);
    setSelectedMemoId(newSelectedId);
    setIsEditMode(false);
  }, [memos]);

  // メモ並び替えアクション
  const reorderMemos = useCallback((dragIndex: number, dropIndex: number) => {
    setMemos((prevMemos) => {
      const reordered = [...prevMemos];
      const [draggedMemo] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, draggedMemo);

      // order を更新
      reordered.forEach((memo, index) => {
        memo.order = index;
      });

      return reordered;
    });
  }, []);

  // 編集モード切り替え
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  // =====[ 戻り値 ]==================================================================
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
