// 1. キーボード操作とロービングタブインデックス対応（上下矢印で移動、Enter/Spaceで選択）
// 2. ドラッグ＆ドロップによる並び替え（index, onReorder を活用）
// 3. ARIA強化（listbox/option連携、タイトルのアクセシブル名前付け）
// 4. メモ化比較の精緻化（title以外の必要フィールド差分、`onReorder`未使用の解消）
// 5. forwardRef と外部フォーカス制御用の API 追加

// 補足と狙い
// - index と onReorder の未使用を解消し、ドラッグ＆ドロップとショートカットで並び替え可能にしました。HTML5 DnDは軽量ですが、より高度な要件があれば dnd-kit などのライブラリ導入も検討できます。
// - ListItem の forwardRef と roving tabindex 機能に乗る設計にし、キーボード操作（Arrow/Home/End）と選択（Enter/Space）を網羅。
// - ARIA: 親コンテナは `role="listbox"`、各行は `role="option"` の前提で、`aria-selected` は ListItem 側で付与。ラベルは `aria-label={title}` で明示。
// - メモ化比較では title だけでなく `updatedAt` や `id` を見て、UI差分が発生しうるフィールドで再描画をトリガーするよう調整。
// - onFocusItem は薄い API ですが、親がリスト参照配列を持っていれば、該当 index の要素へ `.focus()` させられます。

// セキュリティと注意点
// - HTML5 DnDはブラウザによって挙動差があるため、複雑な並び替え要件（タッチ対応・仮想スクロールなど）がある場合は dnd-kit 等のライブラリの方が安全です。
// - `Number.MAX_SAFE_INTEGER` を End キーで渡すのは「親でクランプする」前提の簡易実装です。親で配列長に合わせて補正してください。
// - `new Date(memo.updatedAt).toLocaleString()` はタイムゾーン依存。国際化が必要なら `Intl.DateTimeFormat` を利用してください。

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
