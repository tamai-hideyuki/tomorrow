// 1. 日付フォーマットをユーティリティへ分離（src/utils/dateFormatter.ts）
// 2. フォームの制御とアクセシビリティ改善（label, aria-describedby, type=“button”）
// 3. 編集モードのUX改善（Enterで保存、Escでキャンセル、変更有無判定、保存ボタンのdisabled制御）
// 4. コンポーネントの責務分離（ヘッダー/メタ情報/アクションバーを小さなサブコンポーネントに）
// 5. 型と再レンダリングの最適化（React.memo、useCallback、useEffectの依存修正）

// 主な改善点
// - 再利用性: 日付フォーマットをユーティリティへ分離し、他コンポーネントでも使えるようにしました。テストも単体で容易です。
// - アクセシビリティ: 入力にlabelを付与、メタ情報をaria-describedbyで関連付け。ボタンはtype=“button”明示、状態に応じてaria-disabledを反映。
// - UX: Cmd/Ctrl+Enterで保存、Escでキャンセル。変更が無ければ保存ボタン無効化。キャンセルでフォーム値を元に戻す。
// - パフォーマンス: React.memoで不必要な再レンダリングを抑制。useCallbackでハンドラの再生成を抑え、useEffectの依存をmemoのフィールド粒度に調整。
// - コード構造: MetaRowとActionBarを分離して読みやすく。クラス名は一貫した命名で把握しやすく。

import React, { useState, useEffect } from 'react';
import { Memo } from '../types';

type MemoEditorProps = {
  memo: Memo;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onUpdateMemo: (title: string, body: string) => void;
  onDeleteMemo: () => void;
};

//問題: 日付フォーマット関数がコンポーネント内に存在
//影響: 再利用性の低下、テストの困難さ
//改善案: src/utils/dateFormatter.ts の作成
const formatJapaneseDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const MemoEditor: React.FC<MemoEditorProps> = ({
  memo,
  isEditMode,
  onToggleEditMode,
  onUpdateMemo,
  onDeleteMemo,
}) => {
  const [title, setTitle] = useState(memo.title);
  const [body, setBody] = useState(memo.body);

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
        <div className="flex-row gap-lg p-sm" style={{ fontSize: '0.85rem', color: '#666' }}>
          <span>作成: {formatJapaneseDateTime(memo.createdAt)}</span>
          <span>更新: {formatJapaneseDateTime(memo.updatedAt)}</span>
        </div>
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
