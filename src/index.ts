//必要な情報を持ってくる
import { Memo } from "./types";
import { STORAGE_KEY } from "./storage";
import { readLocalStorage, saveLocalStorage } from "./storage";

// グローバル変数
let memos: Memo[] = []; // 全てのメモを保持
let memoIndex: number = 0; // 今選んでいるメモの位置
let draggedMemoId: string | null = null; // ドラッグ中のメモID

// 要素一覧
const memoList = document.getElementById("list") as HTMLDivElement;
const addButton = document.getElementById("add") as HTMLButtonElement;
const memoTitle = document.getElementById("memoTitle") as HTMLInputElement;
const memoBody = document.getElementById("memoBody") as HTMLTextAreaElement;
const editButton = document.getElementById("edit") as HTMLButtonElement;
const saveButton = document.getElementById("save") as HTMLButtonElement;
const deleteButton = document.getElementById("delete") as HTMLButtonElement;

// ユーティリティ関数
function newMemo(): Memo {
  const timestamp: number = Date.now();
  return {
    id: crypto.randomUUID(),
    title: `new memo ${memos.length + 1}`,
    body: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    order: memos.length,
  };
}

//メモの要素を作成する
function newMemoElement(memo: Memo): HTMLDivElement {
  const div = document.createElement("div");
  div.innerText = memo.title;
  div.setAttribute("data-id", memo.id);
  div.classList.add("w-full", "p-sm");

  // ドラッグ可能にする
  div.draggable = true;

  // ドラッグイベントを追加
  div.addEventListener("dragstart", handleDragStart);
  div.addEventListener("dragover", handleDragOver);
  div.addEventListener("dragenter", handleDragEnter);
  div.addEventListener("dragleave", handleDragLeave);
  div.addEventListener("drop", handleDrop);
  div.addEventListener("dragend", handleDragEnd);

  // クリックイベント
  div.addEventListener("click", selectedMemo);

  return div;
}

//すべてのメモ要素を削除する
function clearMemoElements(div: HTMLDivElement) {
  div.innerText = "";
}

//すべてのメモ要素を表示する
function showMemoElements(div: HTMLDivElement, memos: Memo[]) {
  clearMemoElements(div);
  memos.forEach((memo) => {
    const memoElement = newMemoElement(memo);
    div.appendChild(memoElement);
  });
}

//div要素にアクティブスタイルを設定する
function setActiveStyle(index: number, isActive: boolean) {
  const selector = `#list > div:nth-child(${index})`;
  const element = document.querySelector(selector) as HTMLDivElement;
  if (element) {
    if (isActive) {
      element.classList.add("active");
    } else {
      element.classList.remove("active");
    }
  }
}

//メモの設定する
function setMemoElement() {
  const memo: Memo = memos[memoIndex];
  memoTitle.value = memo.title;
  memoBody.value = memo.body;
}

//button要素の表示・非表示を設定する
function setHiddenButton(button: HTMLButtonElement, isHidden: boolean) {
  if (isHidden) {
    button.removeAttribute("hidden");
  } else {
    button.setAttribute("hidden", "hidden");
  }
}

//タイトルと本文の要素のdisabled属性を設定する
function setEditMode(editMode: boolean) {
  if (editMode) {
    memoTitle.removeAttribute("disabled");
    memoBody.removeAttribute("disabled");
  } else {
    memoTitle.setAttribute("disabled", "disabled");
    memoBody.setAttribute("disabled", "disabled");
  }
}

// ドラッグ&ドロップイベントハンドラー

//ドラッグ開始
function handleDragStart(event: DragEvent) {
  const target = event.target as HTMLDivElement;
  draggedMemoId = target.getAttribute("data-id");
  target.style.opacity = "0.4";

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

//ドラッグ中（ドロップ先の上を通過）
function handleDragOver(event: DragEvent) {
  event.preventDefault();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

//ドロップ先に入った
function handleDragEnter(event: DragEvent) {
  const target = event.target as HTMLDivElement;
  const targetId = target.getAttribute("data-id");

  if (targetId && targetId !== draggedMemoId) {
    target.style.borderTop = "2px solid #4a90e2";
  }
}

//ドロップ先から出た
function handleDragLeave(event: DragEvent) {
  const target = event.target as HTMLDivElement;
  target.style.borderTop = "";
}

//ドロップ
function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.target as HTMLDivElement;
  const targetMemoId = target.getAttribute("data-id");

  target.style.borderTop = "";

  if (draggedMemoId && targetMemoId && draggedMemoId !== targetMemoId) {
    const draggedIndex = memos.findIndex((m) => m.id === draggedMemoId);
    const targetIndex = memos.findIndex((m) => m.id === targetMemoId);

    // 配列から要素を削除して、新しい位置に挿入
    const [draggedMemo] = memos.splice(draggedIndex, 1);
    memos.splice(targetIndex, 0, draggedMemo);

    // orderを更新
    memos.forEach((memo, index) => {
      memo.order = index;
    });

    // 現在選択中のメモのインデックスを更新
    const currentMemoId = memos[memoIndex].id;
    memoIndex = memos.findIndex((m) => m.id === currentMemoId);

    // ローカルストレージに保存
    saveLocalStorage(STORAGE_KEY, memos);

    // 画面を再描画
    showMemoElements(memoList, memos);

    // アクティブなメモを維持
    setActiveStyle(memoIndex + 1, true);
  }
}

//ドラッグ終了
function handleDragEnd(event: DragEvent) {
  const target = event.target as HTMLDivElement;
  target.style.opacity = "1";

  // すべての要素からボーダーを削除
  document.querySelectorAll("#list > div").forEach((element) => {
    (element as HTMLDivElement).style.borderTop = "";
  });

  draggedMemoId = null;
}

// イベントハンドラー関数

//メモが選択された時の処理
function selectedMemo(event: MouseEvent) {
  setEditMode(false);
  setHiddenButton(saveButton, false);
  setHiddenButton(editButton, true);
  setActiveStyle(memoIndex + 1, false);

  const target = event.target as HTMLDivElement;
  const id = target.getAttribute("data-id");
  memoIndex = memos.findIndex((memo) => memo.id === id);
  setMemoElement();
  setActiveStyle(memoIndex + 1, true);
}

//編集ボタンが押された時の処理
function clickEditMemo(event: MouseEvent) {
  setEditMode(true);
  setHiddenButton(saveButton, true);
  setHiddenButton(editButton, false);
}

//保存ボタンが押された時の処理
function clickSaveMemo(event: MouseEvent) {
  const memo = memos[memoIndex];
  memo.title = memoTitle.value;
  memo.body = memoBody.value;
  memo.updatedAt = Date.now();
  saveLocalStorage(STORAGE_KEY, memos);
  setEditMode(false);
  setHiddenButton(saveButton, false);
  setHiddenButton(editButton, true);
  showMemoElements(memoList, memos);
  setActiveStyle(memoIndex + 1, true);
}

//追加ボタンが押された時の処理
function clickAddMemo(event: MouseEvent) {
  setEditMode(true);
  setHiddenButton(saveButton, true);
  setHiddenButton(editButton, false);
  memos.push(newMemo());
  saveLocalStorage(STORAGE_KEY, memos);
  memoIndex = memos.length - 1;
  showMemoElements(memoList, memos);
  setActiveStyle(memoIndex + 1, true);
  setMemoElement();
}

//削除ボタンが押された時の処理
function clickDeleteMemo(event: MouseEvent) {
  if (memos.length === 1) {
    alert("これ以上削除できません。");
    return;
  }

  const memoId = memos[memoIndex].id;
  memos = memos.filter((memo) => memo.id !== memoId);

  // orderを再設定
  memos.forEach((memo, index) => {
    memo.order = index;
  });

  saveLocalStorage(STORAGE_KEY, memos);

  if (1 <= memoIndex) {
    memoIndex--;
  }

  setMemoElement();
  setEditMode(false);
  setHiddenButton(saveButton, false);
  setHiddenButton(editButton, true);
  showMemoElements(memoList, memos);
  setActiveStyle(memoIndex + 1, true);
}

// 初期化関数

//初期化
function init() {
  memos = readLocalStorage(STORAGE_KEY);

  if (memos.length === 0) {
    memos.push(newMemo());
    memos.push(newMemo());
    saveLocalStorage(STORAGE_KEY, memos);
  } else {
    // orderがない古いデータの場合、orderを追加
    memos.forEach((memo, index) => {
      if (memo.order === undefined) {
        memo.order = index;
      }
    });

    // orderでソート
    memos.sort((a, b) => a.order - b.order);
  }

  showMemoElements(memoList, memos);
  setActiveStyle(memoIndex + 1, true);
  setMemoElement();
}

// 処理開始

// イベントリスナーの登録
addButton.addEventListener("click", clickAddMemo);
editButton.addEventListener("click", clickEditMemo);
saveButton.addEventListener("click", clickSaveMemo);
deleteButton.addEventListener("click", clickDeleteMemo);

// 初期化実行
init();

