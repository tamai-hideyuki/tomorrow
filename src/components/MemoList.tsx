import React from 'react';
import { Memo } from '../types';
import MemoItem from './MemoItem';

type MemoListProps = {
  memos: Memo[];
  selectedIndex: number;
  onSelectMemo: (index: number) => void;
  onAddMemo: () => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
};

const MemoList: React.FC<MemoListProps> = ({
  memos,
  selectedIndex,
  onSelectMemo,
  onAddMemo,
  onReorder,
}) => {
  return (
    <div className="flex-col flex-between w-240 border-r">
      <div className="flex-col flex-start">
        <h1 hidden>メモアプリ</h1>
        <h2 className="text-lg">メモ一覧</h2>
        <div className="text-md flex-col gap-md w-full">
          {memos.map((memo, index) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              index={index}
              isActive={index === selectedIndex}
              onSelect={() => onSelectMemo(index)}
              onReorder={onReorder}
            />
          ))}
        </div>
      </div>
      <div className="flex-col flex-center w-full p-lg">
        <button type="button" onClick={onAddMemo}>
          追加
        </button>
      </div>
    </div>
  );
};

export default MemoList;
