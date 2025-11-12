//ドメインの Memo を、汎用の ListItem に“どう表示するか”だけを定義する「1行分の表示用（molecule）コンポーネント

//何を“する”ファイルか（In-scope）
// memo の内容（いまは主に title）を表示する
// 空なら "無題" をフォールバック表示
// active 状態を 見た目に反映（背景色切り替えは ListItem に委譲）
// クリック時に 選択イベントを親へ通知（onSelect を呼ぶ）
// 将来のD&D対応に向けた拡張余地のコメントを保持（実装はしない）

//何を“しない”ファイルか（Out-of-scope）
// 状態管理（どれが選択中か／並び順の確定は親＝リスト側）
// データ取得・保存（APIやストレージは関与しない）
// D&Dの実装（フック化やハンドルは別責務）
// 詳細な整形（日付フォーマット等は必要ならユーティリティで）

import React from 'react';
import ListItem from '../atoms/ListItem';
import type { Memo } from '../../types';

type MemoListItemProps = Readonly<{
  memo: Memo;
  active: boolean;
  index: number;
  onSelect: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}>;

const MemoListItemBase: React.FC<MemoListItemProps> = ({ memo, active, onSelect }) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // ListItem 側で tabIndex/role は付与済み。Enter/Space で選択できるようにする
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
      {/* 将来のD&Dハンドル（別責務のフックで付与）
          <span className="ml-2 cursor-grab" aria-label="並び替え">⋮⋮</span> */}
    </ListItem>
  );
};

// memo: 再レンダリング抑制（active/title が同じなら再描画しない）
const MemoListItem = React.memo(MemoListItemBase, (prev, next) => {
  return (
    prev.active === next.active &&
    prev.index === next.index &&
    (prev.memo.title || '') === (next.memo.title || '')
  );
});

export default MemoListItem;

//Reactのpropsはそもそも 不変（immutable） が前提の設計です。
//つまり Readonly を明示しなくても、再代入しないように扱うのが普通。
//→ だから、実行上はReadonlyを付けなくても問題ない。
//それでもあえて Readonly を付ける理由
//
// 「この型はprops専用、値を変更しない」を明示できる。
// 間違ってprops.memo.title = ...などを書いた時に即エラーになる。
// Memo（mutableかもしれない）とは違って、UI層はimmutableであることを強調できる。
// “UIは常にpure（副作用を持たない）”という思想を型で表す。
//
//なので⇩でもOK
// type MemoListItemProps = {
//   memo: Memo;
//   active: boolean;
//   onSelect: () => void;
// };
//Readonly は「propsを不変として扱う設計意図を明示するための飾り」
