// 1. 見出しレベルごとのデフォルトスタイル
// Tailwindなどでレベルに応じたサイズ・余白・フォントを切り替えると運用が楽

// 2. 自動アンカー生成（目次やリンク用）
// 見出しテキストから`id`をスラッグ化して自動付与すると、ページ内リンクが簡単に作れる

// 3. セマンティックと見た目の分離（as + visualLevel）
// 文書構造上は`h1`が1つ、セクション内は`h2/h3`…が良いが、見た目のサイズは場面で変えたいこと。タグ（セマンティクス）と見た目サイズを分離

// 4. アクセシビリティの補助（セクション連携・見出しの省略）
// - セクショニング要素と組み合わせる場合、`aria-labelledby`で見出しIDを参照するユーティリティが便利
// - 見出しを視覚的に非表示にして、スクリーンリーダー専用にするパターン（sr-only）も

// 5. MarkdownやMDX連携を見据えたAPI
// MDXを使うなら、`Heading`を`mdxComponents`に登録して、`#`～`######`を自動でこのコンポーネントに差し替えられるようにしておくと、サイト全体の見出しスタイルを統一できます。MDX側の設定例はプロジェクトにより異なりますが、‎`Heading`は「‎`as`と‎`visualLevel`」「自動アンカー」「classNameマージ」が揃っていると適用が簡単です。

// 6. 型の安全性向上（Tag推論）
// 現状の`as const`はJS的にはOKですが、TSでは`keyof JSX.IntrinsicElements`で明示しておくと安心です。

// 7. 見出しにアイコンやトレーリングUI
// 見出し右に「コピーリンク」ボタンや「編集リンク」を出す用途が多いので、`actions`スロットを持たせます。

// 8. 目次（Table of Contents）生成のための収集ポイント
// ページで使われた`Heading`から`id`と`level`を収集してTOCを作るなら、`onMount`風にコールバックで登録すると便利です。

import React from 'react';

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
};

const Heading: React.FC<HeadingProps> = ({ level = 2, className = '', children }) => {
  const Tag = `h${level}` as const;
  return <Tag className={className}>{children}</Tag>;
};

export default Heading;
