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
    addMemo,
    selectMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
    toggleEditMode,
  } = useMemos();

  const selectedMemo = memos.find((memo) => memo.id === selectedMemoId);
  const selectedIndex = memos.findIndex((memo) => memo.id === selectedMemoId);

  if (status === 'loading') {
    return <div className="flex-col flex-center h-screen w-full">読み込み中...</div>;
  }

  if (status === 'error') {
    return (
      <div className="flex-col flex-center h-screen w-full">
        <h2>エラーが発生しました</h2>
        <p>バックエンドサーバーに接続できません</p>
        <button type="button" onClick={() => window.location.reload()}>
          再読み込み
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
