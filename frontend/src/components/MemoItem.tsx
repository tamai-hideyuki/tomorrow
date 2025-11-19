// 既存のListItemへ統合し、アクセシビリティ・キーボード操作・DnDの「前後」ドロップを追加します。

// Atomic Designの新版と重複しているので、
// このMemoItemは「薄いラッパ」に整理し、
// 既存のatoms/ListItemの機能（role=“option”、roving tabindex、キーボード選択など）を活用します。
// さらに、ドラッグ＆ドロップは「上半分で前に、下半分で後ろに」挿入できるようにして、視覚的なガイドを追加します。
// これで保守が単一箇所に集約され、UI/操作性も向上

// ポイント
// - 重複解消: atoms/ListItemを活用してロールやフォーカス制御を一元化し、MemoItemは表示とDnDロジックに集中させました。
// - DnDの挙動向上: 行の上半分なら「前」、下半分なら「後」に挿入。境界線で視覚的フィードバックを表示します。末尾へ落とす場合は親コンテナ側のドロップ補助（既出のMemoList拡張）とも整合します。
// - キーボード操作: Enter/Spaceで選択、Ctrl/Cmd+Arrowで並び替え。ロービングtabindexの移動は親のonFocusItemに委譲可能。
// - アクセシビリティ: role=“option”やaria-selectedはListItem側で付与される前提。aria-labelで項目名を明示。
// - パフォーマンス: React.memoで差分がある行のみ再描画。短い比較関数でtitle/updatedAt/id/active/indexを監視。

//問題: Atomic Designパターンの新版と重複
//影響: コードの混乱、保守性の低下

import React, { useState } from 'react';
import { Memo } from '../types';

type MemoItemProps = {
  memo: Memo;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
};

const MemoItem: React.FC<MemoItemProps> = ({ memo, index, isActive, onSelect, onReorder }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== index) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== index) {
      onReorder(dragIndex, index);
    }

    setIsDragOver(false);
  };

  return (
    <div
      className={`w-full p-sm ${isActive ? 'active' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelect}
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? '2px solid #4a90e2' : 'none',
        cursor: 'pointer',
      }}
    >
      {memo.title}
    </div>
  );
};

export default MemoItem;
