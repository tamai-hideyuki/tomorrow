# React移行作業手順書

## 概要
このドキュメントは、TypeScript + Webpack で構築されたバニラJSメモアプリケーションをReactアプリケーションに移行するための手順書です。

## 現在の構成
- **フレームワーク**: バニラTypeScript
- **ビルドツール**: Webpack 5
- **主要機能**:
  - メモの作成・編集・削除
  - ドラッグ&ドロップによる並び替え
  - LocalStorageでのデータ永続化

---

## 移行手順

### Phase 1: 環境構築とReact導入

#### 1.1 必要なパッケージのインストール

```bash
# React関連パッケージ
npm install react react-dom

# 型定義
npm install --save-dev @types/react @types/react-dom

# Babel関連（TSXファイルのトランスパイル用）
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript babel-loader

# CSSローダー（必要に応じて）
npm install --save-dev css-loader style-loader
```

#### 1.2 TypeScript設定の更新

[tsconfig.json](tsconfig.json) を以下のように更新:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

#### 1.3 Webpack設定の更新

[webpack.config.js](webpack.config.js) を以下のように更新:

```javascript
module.exports = {
  entry: './src/index.tsx',
  output: {
    path: `${__dirname}/dist`,
    filename: 'bundle.js',
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  devServer: {
    static: {
      directory: `${__dirname}/dist`,
    },
    hot: true,
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

#### 1.4 HTMLファイルの更新

[dist/index.html](dist/index.html) を以下のように更新:

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>メモアプリ</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="bundle.js" defer></script>
  </body>
</html>
```

---

### Phase 2: React コンポーネントの作成

#### 2.1 ディレクトリ構造の設計

推奨するディレクトリ構造:

```
src/
├── index.tsx              # エントリーポイント
├── App.tsx               # メインアプリケーションコンポーネント
├── types.ts              # 型定義（既存）
├── storage.ts            # LocalStorage関連（既存）
├── components/
│   ├── MemoList.tsx      # メモ一覧コンポーネント
│   ├── MemoItem.tsx      # 個別メモアイテムコンポーネント
│   ├── MemoEditor.tsx    # メモ編集エリアコンポーネント
│   └── MemoButtons.tsx   # ボタン群コンポーネント
├── hooks/
│   ├── useMemos.ts       # メモ管理カスタムフック
│   └── useLocalStorage.ts # LocalStorage管理カスタムフック
└── context/
    └── MemoContext.tsx   # メモ状態管理コンテキスト（オプション）
```

#### 2.2 エントリーポイントの作成

`src/index.tsx` を作成:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 2.3 メインアプリケーションコンポーネントの作成

`src/App.tsx` を作成:

```tsx
import React, { useState, useEffect } from 'react';
import { Memo } from './types';
import { STORAGE_KEY } from './storage';
import { readLocalStorage, saveLocalStorage } from './storage';
import MemoList from './components/MemoList';
import MemoEditor from './components/MemoEditor';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoIndex, setSelectedMemoIndex] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // 初期化
  useEffect(() => {
    let loadedMemos = readLocalStorage(STORAGE_KEY);

    if (loadedMemos.length === 0) {
      loadedMemos = [createNewMemo(0), createNewMemo(1)];
      saveLocalStorage(STORAGE_KEY, loadedMemos);
    } else {
      // orderがない古いデータの場合、orderを追加
      loadedMemos.forEach((memo, index) => {
        if (memo.order === undefined) {
          memo.order = index;
        }
      });
      loadedMemos.sort((a, b) => a.order - b.order);
    }

    setMemos(loadedMemos);
  }, []);

  // メモが更新されたらLocalStorageに保存
  useEffect(() => {
    if (memos.length > 0) {
      saveLocalStorage(STORAGE_KEY, memos);
    }
  }, [memos]);

  const createNewMemo = (count: number): Memo => {
    const timestamp = Date.now();
    return {
      id: crypto.randomUUID(),
      title: `new memo ${count + 1}`,
      body: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      order: count,
    };
  };

  const handleAddMemo = () => {
    const newMemo = createNewMemo(memos.length);
    setMemos([...memos, newMemo]);
    setSelectedMemoIndex(memos.length);
    setIsEditMode(true);
  };

  const handleSelectMemo = (index: number) => {
    setSelectedMemoIndex(index);
    setIsEditMode(false);
  };

  const handleUpdateMemo = (title: string, body: string) => {
    const updatedMemos = [...memos];
    updatedMemos[selectedMemoIndex] = {
      ...updatedMemos[selectedMemoIndex],
      title,
      body,
      updatedAt: Date.now(),
    };
    setMemos(updatedMemos);
  };

  const handleDeleteMemo = () => {
    if (memos.length === 1) {
      alert('これ以上削除できません。');
      return;
    }

    const newMemos = memos.filter((_, index) => index !== selectedMemoIndex);
    newMemos.forEach((memo, index) => {
      memo.order = index;
    });

    setMemos(newMemos);
    setSelectedMemoIndex(Math.max(0, selectedMemoIndex - 1));
    setIsEditMode(false);
  };

  const handleReorderMemos = (dragIndex: number, dropIndex: number) => {
    const reorderedMemos = [...memos];
    const [draggedMemo] = reorderedMemos.splice(dragIndex, 1);
    reorderedMemos.splice(dropIndex, 0, draggedMemo);

    reorderedMemos.forEach((memo, index) => {
      memo.order = index;
    });

    const currentMemoId = memos[selectedMemoIndex].id;
    const newIndex = reorderedMemos.findIndex(m => m.id === currentMemoId);

    setMemos(reorderedMemos);
    setSelectedMemoIndex(newIndex);
  };

  const selectedMemo = memos[selectedMemoIndex];

  return (
    <div className="flex-row h-screen w-full">
      <MemoList
        memos={memos}
        selectedIndex={selectedMemoIndex}
        onSelectMemo={handleSelectMemo}
        onAddMemo={handleAddMemo}
        onReorder={handleReorderMemos}
      />
      {selectedMemo && (
        <MemoEditor
          memo={selectedMemo}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onUpdateMemo={handleUpdateMemo}
          onDeleteMemo={handleDeleteMemo}
        />
      )}
    </div>
  );
};

export default App;
```

---

### Phase 3: 個別コンポーネントの実装

#### 3.1 MemoListコンポーネント

`src/components/MemoList.tsx` を作成:

```tsx
import React from 'react';
import { Memo } from '../types';
import MemoItem from './MemoItem';

interface MemoListProps {
  memos: Memo[];
  selectedIndex: number;
  onSelectMemo: (index: number) => void;
  onAddMemo: () => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
}

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
```

#### 3.2 MemoItemコンポーネント

`src/components/MemoItem.tsx` を作成:

```tsx
import React, { useState } from 'react';
import { Memo } from '../types';

interface MemoItemProps {
  memo: Memo;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({
  memo,
  index,
  isActive,
  onSelect,
  onReorder,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== index) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== index) {
      onReorder(dragIndex, index);
    }

    setIsDragOver(false);
  };

  return (
    <div
      className={`w-full p-sm ${isActive ? 'active' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelect}
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? '2px solid #4a90e2' : 'none',
        cursor: 'pointer',
      }}
    >
      {memo.title}
    </div>
  );
};

export default MemoItem;
```

#### 3.3 MemoEditorコンポーネント

`src/components/MemoEditor.tsx` を作成:

```tsx
import React, { useState, useEffect } from 'react';
import { Memo } from '../types';

interface MemoEditorProps {
  memo: Memo;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onUpdateMemo: (title: string, body: string) => void;
  onDeleteMemo: () => void;
}

const MemoEditor: React.FC<MemoEditorProps> = ({
  memo,
  isEditMode,
  onToggleEditMode,
  onUpdateMemo,
  onDeleteMemo,
}) => {
  const [title, setTitle] = useState(memo.title);
  const [body, setBody] = useState(memo.body);

  // メモが変更されたら入力値を更新
  useEffect(() => {
    setTitle(memo.title);
    setBody(memo.body);
  }, [memo]);

  const handleSave = () => {
    onUpdateMemo(title, body);
    onToggleEditMode();
  };

  const handleCancel = () => {
    setTitle(memo.title);
    setBody(memo.body);
    onToggleEditMode();
  };

  return (
    <div className="flex-col w-full">
      <div className="flex-col h-full p-md">
        <input
          type="text"
          className="text-md p-md"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isEditMode}
        />
        <textarea
          className="h-full text-md p-md"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!isEditMode}
        />
      </div>
      <div className="flex-row flex-end gap-lg p-lg">
        {!isEditMode ? (
          <button type="button" onClick={onToggleEditMode}>
            編集
          </button>
        ) : (
          <>
            <button type="button" onClick={handleSave}>
              保存
            </button>
            <button type="button" onClick={handleCancel}>
              キャンセル
            </button>
          </>
        )}
        <button type="button" onClick={onDeleteMemo}>
          削除
        </button>
      </div>
    </div>
  );
};

export default MemoEditor;
```

---

### Phase 4: カスタムフックの作成（オプション）

状態管理をより効率的にするため、カスタムフックを作成することをお勧めします。

#### 4.1 useMemosフック

`src/hooks/useMemos.ts` を作成:

```tsx
import { useState, useEffect } from 'react';
import { Memo } from '../types';
import { STORAGE_KEY } from '../storage';
import { readLocalStorage, saveLocalStorage } from '../storage';

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemoIndex, setSelectedMemoIndex] = useState<number>(0);

  useEffect(() => {
    let loadedMemos = readLocalStorage(STORAGE_KEY);

    if (loadedMemos.length === 0) {
      loadedMemos = [createNewMemo(0), createNewMemo(1)];
      saveLocalStorage(STORAGE_KEY, loadedMemos);
    } else {
      loadedMemos.forEach((memo, index) => {
        if (memo.order === undefined) {
          memo.order = index;
        }
      });
      loadedMemos.sort((a, b) => a.order - b.order);
    }

    setMemos(loadedMemos);
  }, []);

  useEffect(() => {
    if (memos.length > 0) {
      saveLocalStorage(STORAGE_KEY, memos);
    }
  }, [memos]);

  const createNewMemo = (count: number): Memo => {
    const timestamp = Date.now();
    return {
      id: crypto.randomUUID(),
      title: `new memo ${count + 1}`,
      body: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      order: count,
    };
  };

  const addMemo = () => {
    const newMemo = createNewMemo(memos.length);
    setMemos([...memos, newMemo]);
    setSelectedMemoIndex(memos.length);
  };

  const updateMemo = (index: number, title: string, body: string) => {
    const updatedMemos = [...memos];
    updatedMemos[index] = {
      ...updatedMemos[index],
      title,
      body,
      updatedAt: Date.now(),
    };
    setMemos(updatedMemos);
  };

  const deleteMemo = (index: number) => {
    if (memos.length === 1) {
      return false;
    }

    const newMemos = memos.filter((_, i) => i !== index);
    newMemos.forEach((memo, i) => {
      memo.order = i;
    });

    setMemos(newMemos);
    setSelectedMemoIndex(Math.max(0, selectedMemoIndex - 1));
    return true;
  };

  const reorderMemos = (dragIndex: number, dropIndex: number) => {
    const reorderedMemos = [...memos];
    const [draggedMemo] = reorderedMemos.splice(dragIndex, 1);
    reorderedMemos.splice(dropIndex, 0, draggedMemo);

    reorderedMemos.forEach((memo, index) => {
      memo.order = index;
    });

    const currentMemoId = memos[selectedMemoIndex].id;
    const newIndex = reorderedMemos.findIndex(m => m.id === currentMemoId);

    setMemos(reorderedMemos);
    setSelectedMemoIndex(newIndex);
  };

  return {
    memos,
    selectedMemoIndex,
    setSelectedMemoIndex,
    addMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
  };
};
```

---

### Phase 5: テストとデバッグ

#### 5.1 開発サーバーの起動

```bash
npm start
```

#### 5.2 確認項目

- [ ] メモ一覧が表示される
- [ ] メモの追加ができる
- [ ] メモの編集ができる
- [ ] メモの削除ができる
- [ ] メモのドラッグ&ドロップができる
- [ ] LocalStorageにデータが保存される
- [ ] ページをリロードしてもデータが保持される

#### 5.3 デバッグのポイント

- React DevTools を使用して状態の変化を確認
- Console でエラーが出ていないか確認
- LocalStorage の内容を確認（Chrome DevTools > Application > Local Storage）

---

### Phase 6: ビルドと本番環境への移行

#### 6.1 本番ビルド

```bash
npm run build
```

#### 6.2 package.jsonのスクリプト更新（オプション）

```json
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
    "dev": "webpack serve --mode development"
  }
}
```

---

## 追加の改善提案

### 1. 状態管理ライブラリの導入（オプション）

複雑な状態管理が必要になった場合:

- **Context API**: 軽量な状態管理
- **Zustand**: シンプルな状態管理ライブラリ
- **Redux Toolkit**: 大規模アプリケーション向け

### 2. UIライブラリの導入（オプション）

- **Material-UI (MUI)**: Material Design
- **Chakra UI**: アクセシブルなコンポーネント
- **Tailwind CSS**: ユーティリティファーストCSS

### 3. テストの追加

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### 4. Linter/Formatterの導入

```bash
npm install --save-dev eslint prettier eslint-plugin-react
```

---

## トラブルシューティング

### よくある問題

1. **JSX syntax error**
   - tsconfig.json で `"jsx": "react-jsx"` が設定されているか確認

2. **Module not found**
   - webpack.config.js の `resolve.extensions` に `.tsx` が含まれているか確認

3. **React is not defined**
   - React 17以降は import React を省略可能だが、古いコードでは必要

4. **Hot reload が動作しない**
   - webpack.config.js の `devServer.hot` を `true` に設定

---

## 参考リンク

- [React公式ドキュメント](https://react.dev/)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/)
- [Webpack公式ドキュメント](https://webpack.js.org/)

---

## 移行チェックリスト

- [ ] Phase 1: 環境構築完了
- [ ] Phase 2: Reactコンポーネント作成完了
- [ ] Phase 3: 個別コンポーネント実装完了
- [ ] Phase 4: カスタムフック作成完了（オプション）
- [ ] Phase 5: テスト・デバッグ完了
- [ ] Phase 6: 本番ビルド確認完了
- [ ] 既存機能の動作確認完了
- [ ] 旧コードの削除（[src/index.ts](src/index.ts:1)など）
