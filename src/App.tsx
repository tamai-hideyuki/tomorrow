// =====[ L1: UI Composition Layer ]=================================================
// 役割: 画面の骨組み。状態はカスタムフックから受け取り、描画だけ行う。
// このファイルには「I/O」「状態遷移ロジック」「マイグレーション」を置かない。

import React from 'react';
import { useMemos } from './useMemos';
import MemoList from './components/MemoList';
import MemoEditor from './components/MemoEditor';

const App: React.FC = () => {
  // カスタムフックから状態とアクションを取得
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

  // 選択中のメモを取得
  const selectedMemo = memos.find((memo) => memo.id === selectedMemoId);
  const selectedIndex = memos.findIndex((memo) => memo.id === selectedMemoId);

  // ローディング中の表示
  if (status === 'loading') {
    return <div>読み込み中...</div>;
  }

  // ディレクトリ選択が必要な場合の表示
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

  // メイン画面の表示
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
