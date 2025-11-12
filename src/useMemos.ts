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
      //問題: alert() の使用、サイレントエラー(「サイレントエラー」とは、エラーが起きてもユーザーや開発者に伝わらない状態のこと)
      //影響: UXの低下、エラーの見逃し
      //改善案: エラー状態管理、トースト通知の実装
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      //alert() はスクリプト実行を止めるため、テストランナー（Vitest, Jest, Playwrightなど）でテストが止まる。
      //自動テストやCI/CDパイプラインがブロックされるリスクがあります。
      //UI通知（トースト or Snackbar）を導入して対策するとUX的にも開発的にもいい感じ
      //alert('メモの読み込みに失敗しました');
      toast.error('メモの読み込みに失敗しました');
    }
  };

  //問題: memosが変更されるたびに全メモを保存
  //影響: ファイルシステムへの大量書き込み、パフォーマンス低下
  //改善案: デバウンス処理、差分保存の実装
  //
  //この状況で起こること
  //タイトルを1文字入力するたびに setMemos が走る → useEffect が再実行。
  //saveAllMemos() が呼ばれ、全メモをループして await memoRepository.saveOne(memo)。
  //ファイルシステムへのアクセスが大量発生（File System Access APIの場合、特に重い）。
  //保存中に次の更新が来ると競合・ラグ・フリーズ感が出ることもある。
  //つまり、状態更新頻度が高いアプリでは致命的なパフォーマンス低下になります。
  // useEffect(() => {
  //   if (memos.length > 0 && status === 'ready') {
  //     saveAllMemos();
  //   }
  // }, [memos, status]);

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

  // const saveAllMemos = async () => {
  //   try {
  //     for (const memo of memos) {
  //       await memoRepository.saveOne(memo);
  //     }
  //   } catch (error) {
  //     console.error('メモ保存エラー:', error);
  //     alert('メモの保存に失敗しました');
  //   }
  // };

  //問題: 依存配列に loadMemos が含まれていない
  //影響: ESLintルール違反、潜在的なバグ
  //useCallback で参照している外部変数（関数含む）は、依存配列に明示的に含めるべき
  //そうしないと、loadMemos の中身が更新されても selectDirectory に古い関数の参照が残ってしまう
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

      //改善策１：map()で新しいオブジェクトを生成する
      //ロジックの責務を分ける（関数化）
      //immer を使う
      // const newMemos = memos.filter((memo) => memo.id !== memoId);
      // newMemos.forEach((memo, index) => {
      //   memo.order = index;
      const reassignOrders = (memos: Memo[]) =>
        memos.map((memo, index) => ({
          ...memo,
          order: index,
        }));

      const newMemos = reassignOrders(memos.filter((memo) => memo.id !== memoId));

      //Reactの useState は「不変性（immutability）」に基づいて動作
      //つまり、状態を直接変更するとReactが変更を検知できない
      //直接 MEMO オブジェクトを変更しているのが問題
      //新しいオブジェクトを生成するようにする

      //具体的に何が起こるか

      //setMemos(newMemos) を呼んでも、
      //その中のオブジェクトが 同じ参照のまま なら React は「変化なし」と判断します。
      //結果、
      //コンポーネントが再レンダリングされない・変更がUIに反映されない・状態が「壊れている」ように見える
      //という事態が起きます。
      //特に memo.order = index のようなオブジェクト内のプロパティ変更は、
      //浅い比較（shallow compare）では検知されません。

      const deletedIndex = memos.findIndex((m) => m.id === memoId);
      const newSelectedIndex = Math.max(0, deletedIndex - 1);
      const newSelectedId = newMemos[newSelectedIndex]?.id;

      setMemos(newMemos);
      setSelectedMemoId(newSelectedId);
      setIsEditMode(false);
    },
    [memos]
  );

  // const reorderMemos = useCallback((dragIndex: number, dropIndex: number) => {
  //   setMemos((prevMemos) => {
  //     const reordered = [...prevMemos];
  //     const [draggedMemo] = reordered.splice(dragIndex, 1);
  //     reordered.splice(dropIndex, 0, draggedMemo);

  //     reordered.forEach((memo, index) => {
  //       memo.order = index;

  //直接 MEMO オブジェクトを変更しているのが問題
  //新しいオブジェクトを生成するようにする
  // });

  //     return reordered;
  //   });
  // }, []);
  const reorderMemos = useCallback((dragIndex: number, dropIndex: number) => {
    setMemos((prevMemos) => {
      // 1. 現在のメモ配列をコピー
      const reordered = [...prevMemos];
      // 2. ドラッグされたメモを取り出す
      const [draggedMemo] = reordered.splice(dragIndex, 1);
      // 3. 新しい位置に挿入
      reordered.splice(dropIndex, 0, draggedMemo);

      // 4. mapで新しいオブジェクトを生成（不変性を維持）
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
