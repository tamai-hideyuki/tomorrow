import React from 'react';
import clsx from 'clsx';

// ListItemProps はこのコンポーネントが受け取る プロパティの型定義。
// active? → オプションの真偽値。現在の項目が「選択中」かどうかを表す。
// onClick? → クリックイベント用の関数。
// children → 内部に表示する要素（テキストや別のReact要素）。

type ListItemProps = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

// React.FC は「Functional Component（関数コンポーネント）」の型。
// ジェネリクスで ListItemProps を渡すことで、propsの型チェックが効く。
// children プロパティが暗黙的に含まれる点も React.FC の特徴。

//テンプレートリテラル（バッククォート `...`）を使い、
// 文字列を動的に組み立てている。
// active が真なら bg-gray-200（選択状態の背景色）を適用。
// 偽なら hover:bg-gray-100（マウスオーバー時の色変化）を適用。
// Tailwind のユーティリティクラスを使うことで、
// CSSファイルを触らずに見た目を制御している。
// この「状態によるクラスの動的付け替え」は 条件付きレンダリング の一種です。

const ListItem: React.FC<ListItemProps> = ({ active, onClick, children }) => (
  // ここが非常に丁寧な作り
  // role="option"
  // → この要素が「選択肢（option）」であることをスクリーンリーダーに伝える。
  // aria-selected={active}
  // → この項目が現在選択中かどうかを伝える。
  // tabIndex={0}
  // → キーボード操作でフォーカス可能にする（div は本来フォーカス不可）。
  // → これにより、マウスだけでなく キーボード操作にも対応 したUIになる。
  // いわゆる アクセシブルなカスタムUIコンポーネント の書き方
  <div
    role="option"
    aria-selected={active}
    tabIndex={0}
    onClick={onClick}
    className={clsx(
      'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer focus:outline-none focus-visible:ring',
      active ? 'bg-gray-200' : 'hover:bg-gray-100'
    )}
  >
    {children}
  </div>
);

export default ListItem;

// onClick と Roleの組み合わせ
// onClick イベントは通常ボタンやリンクに使われますが、
// div をクリック可能にすることで自由なUIデザインを実現。
// 同時に role と tabIndex で「仮想ボタン」のように扱う。
