//幅のリサイズ・ショートカット・アクセシビリティ強化・空状態改善を加える

import React from 'react';
import Heading from '../atoms/Heading';
import Button from '../atoms/Button';
import MemoList from '../organisms/MemoList';
import type { Memo } from '../../types';

type SidebarMemoPanelProps = {
  memos: Memo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder: (from: number, to: number) => void;
};

const SidebarMemoPanel: React.FC<SidebarMemoPanelProps> = ({
  memos,
  selectedId,
  onSelect,
  onAdd,
  onReorder,
}) => {
  return (
    <aside className="flex flex-col justify-between w-60 border-r">
      <div className="p-3">
        <Heading level={2} className="text-lg mb-2">
          メモ一覧
        </Heading>
        <MemoList memos={memos} selectedId={selectedId} onSelect={onSelect} onReorder={onReorder} />
      </div>
      <div className="p-3">
        <Button type="button" onClick={onAdd} aria-label="メモを追加">
          追加
        </Button>
      </div>
    </aside>
  );
};

export default SidebarMemoPanel;
