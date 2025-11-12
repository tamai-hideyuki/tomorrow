import React from 'react';
import { useMemos } from './useMemos';
import MemoList from './components/MemoList';
import MemoEditor from './components/MemoEditor';

const App: React.FC = () => {
  const {
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
  } = useMemos();

  //問題: selectedMemo と selectedIndex が毎レンダリングで再計算
  //影響: 不要な再レンダリング
  const selectedMemo = memos.find((memo) => memo.id === selectedMemoId);
  const selectedIndex = memos.findIndex((memo) => memo.id === selectedMemoId);

  if (status === 'loading') {
    return <div>読み込み中...</div>;
  }

  if (status === 'needDirectory') {
    return (
      <div className="flex-col flex-center h-screen w-full">
        <h2>フォルダを選択してください</h2>
        <p>メモを保存するフォルダを選択します</p>
        <button type="button" onClick={selectDirectory}>
          フォルダを選択
        </button>
      </div>
    );
  }

  return (
    <div className="flex-row h-screen w-full">
      <MemoList
        memos={memos}
        selectedIndex={selectedIndex}
        onSelectMemo={(index) => selectMemo(memos[index].id)}
        onAddMemo={addMemo}
        onReorder={reorderMemos}
      />
      {selectedMemo && (
        <MemoEditor
          memo={selectedMemo}
          isEditMode={isEditMode}
          onToggleEditMode={toggleEditMode}
          onUpdateMemo={(title, body) => updateMemo(selectedMemo.id, title, body)}
          onDeleteMemo={() => deleteMemo(selectedMemo.id)}
        />
      )}
    </div>
  );
};

export default App;
