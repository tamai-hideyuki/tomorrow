import React, { useState, useEffect } from 'react';
import { Memo } from './types';
import {
  selectDirectory,
  getDirectoryHandle,
  loadMemosFromDirectory,
  saveMemoToFile,
  deleteMemoFile,
  migrateFromLocalStorage,
} from './storage';
import MemoList from './components/MemoList';
import MemoEditor from './components/MemoEditor';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoIndex, setSelectedMemoIndex] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDirectorySelected, setIsDirectorySelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初期化
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    
    // まず、既存のディレクトリハンドルを確認
    const handle = await getDirectoryHandle();
    
    if (handle) {
      // フォルダが既に選択されている場合
      await loadMemos();
      setIsDirectorySelected(true);
    } else {
      // localStorageから移行を試みる
      const migratedMemos = await migrateFromLocalStorage();
      if (migratedMemos.length > 0) {
        setMemos(migratedMemos);
      } else {
        // 初期メモを作成
        const initialMemos = [createNewMemo(0), createNewMemo(1)];
        setMemos(initialMemos);
      }
    }
    
    setIsLoading(false);
  };

  // フォルダを選択
  const handleSelectDirectory = async () => {
    const handle = await selectDirectory();
    if (handle) {
      setIsDirectorySelected(true);
      await loadMemos();
    }
  };

  // メモを読み込む
  const loadMemos = async () => {
    try {
      const loadedMemos = await loadMemosFromDirectory();
      
      if (loadedMemos.length === 0) {
        // メモが存在しない場合、初期メモを作成
        const initialMemos = [createNewMemo(0), createNewMemo(1)];
        for (const memo of initialMemos) {
          await saveMemoToFile(memo);
        }
        setMemos(initialMemos);
      } else {
        // orderがない古いデータの場合、orderを追加
        loadedMemos.forEach((memo, index) => {
          if (memo.order === undefined) {
            memo.order = index;
          }
        });
        loadedMemos.sort((a, b) => a.order - b.order);
        setMemos(loadedMemos);
      }
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      alert('メモの読み込みに失敗しました');
    }
  };

  // メモが更新されたらファイルに保存
  useEffect(() => {
    if (memos.length > 0 && isDirectorySelected) {
      saveMemosToFiles();
    }
  }, [memos, isDirectorySelected]);

  const saveMemosToFiles = async () => {
    try {
      for (const memo of memos) {
        await saveMemoToFile(memo);
      }
    } catch (error) {
      console.error('メモ保存エラー:', error);
      alert('メモの保存に失敗しました');
    }
  };

  const createNewMemo = (count: number): Memo => {
    const timestamp = Date.now();
    return {
      id: crypto.randomUUID(),
      title: `new memo ${count + 1}`,
      body: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      order: count,
    };
  };

  const handleAddMemo = async () => {
    if (!isDirectorySelected) {
      alert('まずフォルダを選択してください');
      return;
    }

    const newMemo = createNewMemo(memos.length);
    const updatedMemos = [...memos, newMemo];
    setMemos(updatedMemos);
    setSelectedMemoIndex(updatedMemos.length - 1);
    setIsEditMode(true);
  };

  const handleSelectMemo = (index: number) => {
    setSelectedMemoIndex(index);
    setIsEditMode(false);
  };

  const handleUpdateMemo = (title: string, body: string) => {
    const updatedMemos = [...memos];
    updatedMemos[selectedMemoIndex] = {
      ...updatedMemos[selectedMemoIndex],
      title,
      body,
      updatedAt: Date.now(),
    };
    setMemos(updatedMemos);
  };

  const handleDeleteMemo = async () => {
    if (memos.length === 1) {
      alert('これ以上削除できません。');
      return;
    }

    const memoToDelete = memos[selectedMemoIndex];
    const newMemos = memos.filter((_, index) => index !== selectedMemoIndex);
    newMemos.forEach((memo, index) => {
      memo.order = index;
    });

    // ファイルを削除
    try {
      await deleteMemoFile(memoToDelete.id);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      alert('ファイルの削除に失敗しました');
    }

    setMemos(newMemos);
    setSelectedMemoIndex(Math.max(0, selectedMemoIndex - 1));
    setIsEditMode(false);
  };

  const handleReorderMemos = (dragIndex: number, dropIndex: number) => {
    const reorderedMemos = [...memos];
    const [draggedMemo] = reorderedMemos.splice(dragIndex, 1);
    reorderedMemos.splice(dropIndex, 0, draggedMemo);

    reorderedMemos.forEach((memo, index) => {
      memo.order = index;
    });

    const currentMemoId = memos[selectedMemoIndex].id;
    const newIndex = reorderedMemos.findIndex(m => m.id === currentMemoId);

    setMemos(reorderedMemos);
    setSelectedMemoIndex(newIndex);
  };

  const selectedMemo = memos[selectedMemoIndex];

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (!isDirectorySelected) {
    return (
      <div className="flex-col flex-center h-screen w-full">
        <h2>フォルダを選択してください</h2>
        <p>メモを保存するフォルダを選択します</p>
        <button type="button" onClick={handleSelectDirectory}>
          フォルダを選択
        </button>
      </div>
    );
  }

  return (
    <div className="flex-row h-screen w-full">
      <MemoList
        memos={memos}
        selectedIndex={selectedMemoIndex}
        onSelectMemo={handleSelectMemo}
        onAddMemo={handleAddMemo}
        onReorder={handleReorderMemos}
      />
      {selectedMemo && (
        <MemoEditor
          memo={selectedMemo}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onUpdateMemo={handleUpdateMemo}
          onDeleteMemo={handleDeleteMemo}
        />
      )}
    </div>
  );
};

export default App;
