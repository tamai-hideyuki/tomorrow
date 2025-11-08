import React, { useState, useEffect } from 'react';
import { Memo } from './types';
import { STORAGE_KEY } from './storage';
import { readLocalStorage, saveLocalStorage } from './storage';
import MemoList from './components/MemoList';
import MemoEditor from './components/MemoEditor';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoIndex, setSelectedMemoIndex] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // 初期化
  useEffect(() => {
    let loadedMemos = readLocalStorage(STORAGE_KEY);

    if (loadedMemos.length === 0) {
      loadedMemos = [createNewMemo(0), createNewMemo(1)];
      saveLocalStorage(STORAGE_KEY, loadedMemos);
    } else {
      // orderがない古いデータの場合、orderを追加
      loadedMemos.forEach((memo, index) => {
        if (memo.order === undefined) {
          memo.order = index;
        }
      });
      loadedMemos.sort((a, b) => a.order - b.order);
    }

    setMemos(loadedMemos);
  }, []);

  // メモが更新されたらLocalStorageに保存
  useEffect(() => {
    if (memos.length > 0) {
      saveLocalStorage(STORAGE_KEY, memos);
    }
  }, [memos]);

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

  const handleAddMemo = () => {
    const newMemo = createNewMemo(memos.length);
    setMemos([...memos, newMemo]);
    setSelectedMemoIndex(memos.length);
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

  const handleDeleteMemo = () => {
    if (memos.length === 1) {
      alert('これ以上削除できません。');
      return;
    }

    const newMemos = memos.filter((_, index) => index !== selectedMemoIndex);
    newMemos.forEach((memo, index) => {
      memo.order = index;
    });

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
