// 1. classNameのマージ対応
// 親から渡された`className`を上書きせず結合したい場面が多いです。`clsx`や`tailwind-merge`を使うと便利

// 2. variant / size の拡張
// デザイン体系に合わせて見た目を切り替えられると便利

// 3. アイコンの前後配置
// ボタン内にアイコンを置くケースが多いので、余白ユーティリティで整えると使いやすい

// 4. アクセシビリティの補強
// - ローディング状態を持つなら`aria-busy`や`aria-disabled`を併用
// - 明示的に`type="button"`をデフォルト指定（フォーム内で予期せぬsubmitを防ぐ）

// 5. asChild/リンク対応（必要なら）
// リンク風ボタンを`<a>`や`<Link>`で使いたい場合は`as`プロップでタグを切り替えるパターンがあります。簡易版は下記。

import React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ children, className, ...rest }) => {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 border text-sm transition-colors hover:opacity-90 focus:outline-none focus-visible:ring disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <button className={twMerge(base, className)} {...rest}>
      {children}
    </button>
  );
};
export default Button;
