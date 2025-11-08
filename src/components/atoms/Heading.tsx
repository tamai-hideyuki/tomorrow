import React from 'react';

//level?: 1|2|3|4|5|6
//→ <Heading level={3}> のように、見出しの階層を動的に選べる。
//</Heading>→ デフォルトは 2（＝<h2>）に設定。

// className?: string
// → Tailwind等で柔軟にスタイルを上書き可能。

// children: React.ReactNode
// → JSXタグの中身として、文字列だけでなく他の要素もOK
// 例: <Heading><span>タイトル</span></Heading>
// → React.FC を使うと自動で children が含まれるけど、
// 明示的に書いておくことで「このコンポーネントは中身を持つ」ことが分かりやすくなる。

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
};

//React.FC<HeadingProps>の中身はこんな感じ
//type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactElement | null;
//つまり、
// onst Heading: React.FC<HeadingProps> = ({ level, className, children }) => ...
//TypeScript的には
// const Heading = (props: HeadingProps & { children?: React.ReactNode }): React.ReactElement => ...

const Heading: React.FC<HeadingProps> = ({ level = 2, className = '', children }) => {
  //これは TypeScriptに「Tagは 'h1' | 'h2' | ... | 'h6' のいずれかで固定だよ」と教えるための構文
  //const Tag = `h${level}` as const;
  //そのおかげで <Tag> のように動的なタグ名を使っても型エラーにならない
  //これがないとTypeScriptはTagはただのstringだというようにしか推論できず、Tagはコンポーネントとして使えませんみたいなエラーがでる。
  const Tag = `h${level}` as const;
  return <Tag className={className}>{children}</Tag>;
};

export default Heading;
