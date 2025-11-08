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
