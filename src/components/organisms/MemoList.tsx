import React from 'react';
import type { Memo } from '../../types';
import MemoListItem from '../molecules/MemoListItem';

type MemoListProps = {
  memos: Memo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

const MemoList: React.FC<MemoListProps> = ({ memos, selectedId, onSelect, onReorder }) => {
  return (
    <div role="listbox" aria-label="メモ一覧" className="flex flex-col gap-1 w-full">
      {memos.length === 0 ? (
        <div className="text-sm text-gray-500 px-3 py-2">メモがありません</div>
      ) : (
        memos.map((m, idx) => (
          <MemoListItem
            key={m.id}
            memo={m}
            index={idx}
            active={m.id === selectedId}
            onSelect={() => onSelect(m.id)}
            onReorder={onReorder}
          />
        ))
      )}
    </div>
  );
};

export default MemoList;
