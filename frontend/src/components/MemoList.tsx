// Heading/Buttonの再利用、listboxのARIA、キーボード操作、DnD統合で公式に沿って整理します。
// React公式のコンポーネント設計に寄せるなら、既存の atoms（Heading・Button・ListItem）を活用しつつ、
// listboxパターンのアクセシビリティ、ロービングtabindexのキーボード操作、ドラッグ＆ドロップを統合した薄いコンテナにまとめるのが最も保守しやすい構成です。
// Atomic Designの新版と重複していた責務は MemoItem 側へ寄せ、MemoList は「並べて操作を委譲する」だけにします。

//問題: Atomic Designパターンの新版と重複
//影響: コードの混乱、保守性の低下

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
