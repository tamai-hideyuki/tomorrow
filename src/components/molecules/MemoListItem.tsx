import React from 'react';
import ListItem from '../atoms/ListItem';
import type { Memo } from '../../types';

type MemoListItemProps = {
  memo: Memo;
  active: boolean;
  onSelect: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  index: number;
};

const MemoListItem: React.FC<MemoListItemProps> = ({ memo, active, onSelect }) => {
  // DnDは後で useDragHandle などに切り出し可能
  return (
    <ListItem active={active} onClick={onSelect}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{memo.title || '無題'}</div>
        {/* 例: <div className="text-xs text-gray-500">更新: {new Date(memo.updatedAt).toLocaleString()}</div> */}
      </div>
      {/* <span className="ml-2 cursor-grab" aria-label="並び替え">⋮⋮</span> */}
    </ListItem>
  );
};

export default MemoListItem;
