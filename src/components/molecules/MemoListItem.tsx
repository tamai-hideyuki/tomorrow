import React from 'react';
import ListItem from '../atoms/ListItem';
import type { Memo } from '../../types';

type MemoListItemProps = Readonly<{
  memo: Memo;
  active: boolean;
  //問題: index と onReorder が使用されていない
  //影響: 軽微（混乱の原因）
  index: number;
  onSelect: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}>;

const MemoListItemBase: React.FC<MemoListItemProps> = ({ memo, active, onSelect }) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const title = memo.title?.trim() || '無題';

  return (
    <ListItem active={active} onClick={onSelect}>
      <div className="min-w-0 flex-1" onKeyDown={handleKeyDown}>
        <div className="truncate text-sm font-medium" title={title} data-testid="memo-title">
          {title}
        </div>
      </div>
    </ListItem>
  );
};

const MemoListItem = React.memo(MemoListItemBase, (prev, next) => {
  return (
    prev.active === next.active &&
    prev.index === next.index &&
    (prev.memo.title || '') === (next.memo.title || '')
  );
});

export default MemoListItem;
