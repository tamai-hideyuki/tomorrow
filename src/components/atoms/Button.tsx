import React from 'react';

//独自型を定義しなくてもHTML標準属性を完全サポートするため
//これによって、<button> タグが標準で受け取れる
//すべての属性（type, disabled, onClick, aria-* など）をそのまま使える
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

//{ children, ...rest }　これは拡張性・再利用性のための
//この分割代入で children（表示するテキストやアイコン）だけを明示的に取り出し、
//その他の属性（onClick, type, disabled, aria-label, etc...）は全部 {...rest} にまとめて渡していく
//つまり、
//任意の属性を追加しても壊れない
//TypeScriptが型を保証してくれる
//HTMLのbuttonと同じ挙動を維持

//React.FC（Functional Component） 「関数コンポーネント（Functional Component）の型定義」を簡単に書ける仕組み
//「関数コンポーネント（Functional Component）の型定義」を簡単に書ける仕組み
const Button: React.FC<ButtonProps> = ({ children, ...rest }) => (
  <button
    className="inline-flex items-center justify-center rounded-md px-3 py-2 border text-sm hover:opacity-90 focus:outline-none focus-visible:ring"
    {...rest}
  >
    {children}
  </button>
);

export default Button;

//Reactコンポーネントは何か？ -> ただの関数
//
//
// function Hello() {
//     return <div>Hello</div>;
//   }
//
//例えばこれは裏で、
//
// type ComponentType = (props: any) => React.ReactNode;
//
//こんなのを持ってる
//
//つまり、
//“引数として props を受け取り、JSX（＝ReactNode）を返す関数”がコンポーネントの正体
//
//React.FC は、Reactチームが定義した “そのための型エイリアス”
//ちなみに FC は FunctionComponent の略
//React.FC は実際は別名（type alias）
//
// const Hello: React.FC = () => {
//     return <div>Hello</div>;
//   };
//
//これは TypeScript にとって次の意味になる
//Hello は関数であり、引数に props を受け取って JSX.Element を返す関数
//
//Propsを受け取る場合
//
// type HelloProps = {
//     name: string;
//   };
//
//   const Hello: React.FC<HelloProps> = ({ name }) => {
//     return <div>Hello, {name}!</div>;
//   };
//
//
// ここで React.FC<HelloProps> が効いていて、
// name が string 型であることが保証される
// 間違って number や null を渡すとコンパイルエラー
//children という特別なpropも自動で含まれる
//
//React.FC を使うメリットとデメリット
// | 内容                      | 説明                                        |
// | ----------------------- | ----------------------------------------- |
// | **型推論が効く**              | Propsをジェネリクスで指定できる（`React.FC<MyProps>`）   |
// | **`children`が自動で含まれる**  | デフォルトで `props.children?: ReactNode` が存在する |
// | **JSX.Elementが返ることを保証** | returnの型が明確になる                            |
// | **補完が効きやすい**            | IDEでpropsやchildrenがすぐ出る                   |
//
// | 項目            | 内容                                               |
// | ------------- | ------------------------------------------------ |
// | `React.FC` とは | Functional Component（関数コンポーネント）の型定義              |
// | 使う理由          | propsの型付け・補完・children自動追加のため                     |
// | 現代的トレンド       | 小規模は `React.FC` でもOK、大規模は `: JSX.Element` 明示派が多い |
// | あなたのケース       | 再利用性と安全性を両立するベストな選択（◎）                           |
