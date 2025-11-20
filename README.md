# Memo App

シンプルなメモ管理アプリケーション。フロントエンドとバックエンドが分離されたモノレポ構成で、リアルタイムにメモを作成・編集・削除・並び替えできます。

## 技術スタック

### フロントエンド
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性
- **Webpack** - バンドラー
- **Tailwind Merge & clsx** - スタイリング
- **Sonner** - トースト通知
- **use-debounce** - 自動保存のデバウンス

### バックエンド
- **Hono** - 軽量なWebフレームワーク
- **Node.js** - ランタイム
- **TypeScript** - 型安全性
- **ファイルシステムストレージ** - Markdownファイルでメモを永続化

## 主な機能

### メモ管理
- **メモの作成** - 新しいメモを作成
- **メモの編集** - タイトルと本文を編集（自動保存対応）
- **メモの削除** - 不要なメモを削除（最後の1件は削除不可）
- **メモの並び替え** - ドラッグ&ドロップでメモの順序を変更
- **メモの選択** - サイドバーから編集したいメモを選択

### UI/UX機能
- **編集モード切り替え** - 閲覧モードと編集モードの切り替え
- **自動保存** - 1秒のデバウンスで自動的にサーバーへ保存
- **ローディング状態** - データ読み込み中の表示
- **エラーハンドリング** - サーバー接続エラー時の適切な表示
- **トースト通知** - 操作成功・失敗の通知
- **タイムスタンプ表示** - 作成日時と更新日時の表示

### データ永続化
- **Markdownファイルストレージ** - メモを `memos/` ディレクトリにMarkdown形式で保存
- **フロントマター対応** - YAMLフロントマターでメタデータを管理
- **RESTful API** - `/api/memos` エンドポイントで完全なCRUD操作

## セットアップ

### インストール
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```

フロントエンド: http://localhost:3000
バックエンド: http://localhost:8080

### ビルド
```bash
npm run build
```

## プロジェクト構成

```
tomorrow/
├── frontend/          # Reactフロントエンド
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── api/          # API通信層
│   │   ├── types.ts      # 型定義
│   │   ├── useMemos.ts   # メモ管理フック
│   │   └── App.tsx       # メインアプリ
│   └── package.json
├── backend/           # Honoバックエンド
│   ├── src/
│   │   ├── routes/       # APIルート
│   │   ├── storage.ts    # ファイルストレージ
│   │   ├── repository.ts # データアクセス層
│   │   ├── types.ts      # 型定義
│   │   └── index.ts      # サーバーエントリポイント
│   └── package.json
├── memos/             # メモデータ保存先
└── package.json       # ルートパッケージ（ワークスペース管理）
```

## API仕様

### エンドポイント

- `GET /api/memos` - 全メモ取得
- `GET /api/memos/:id` - 単一メモ取得
- `POST /api/memos` - メモ作成
- `PUT /api/memos/:id` - メモ更新
- `DELETE /api/memos/:id` - メモ削除
- `PUT /api/memos/reorder` - メモ順序変更
- `GET /api/health` - ヘルスチェック
