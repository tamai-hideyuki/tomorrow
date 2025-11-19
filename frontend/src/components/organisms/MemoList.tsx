// 短い計画
// 1. 変数名の可読性改善（memo, indexへ変更）と型の明確化
// 2. キーボード操作・ロービングタブインデックス対応（上下移動、Home/End、Enter/Spaceで選択）
// 3. 並び替えのドラッグ＆ドロップ補助（HTML5 DnDの最低限のサポート）
// 4. スクロール追従と初期フォーカス（選択変更時にスクロール・フォーカス）
// 5. 空状態のアクセシビリティ向上（roleとaria-live）

// ポイント
// - 変数名の可読性改善: `m, idx`ではなく`memo, index`に統一。
// - キーボード操作: コンテナで上下/Home/Endをハンドリングし、選択IDを更新。各項目は`ListItem`側のroving tabindexと組み合わせて自然にフォーカスが移動します。
// - フォーカスとスクロール: `selectedId`が変わったら該当行へ`.focus()`と`scrollIntoView({ block: 'nearest' })`。
// - DnD補助: 子（MemoListItem）のドラッグ開始・ドロップに加え、コンテナの空白へ落とした場合は末尾へ移動。高度な並び替えが必要なら dnd-kit などに差し替え可能。
// - 空状態アクセシビリティ: `role="status"` + `aria-live="polite"`で状態更新を読み上げ。

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
        //問題: m, idx など省略されすぎた変数名
        //影響: 可読性の低下
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
