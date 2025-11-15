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

type Variant = 'default' | 'primary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<Variant, string> = {
  default: 'border bg-white text-gray-900',
  primary: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  ghost: 'border-transparent bg-transparent hover:bg-gray-100',
  destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 border text-sm transition-colors hover:opacity-90 focus:outline-none focus-visible:ring disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <button
      className={twMerge(base, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
};
export default Button;
