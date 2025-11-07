import { Memo } from "./types";

export const STORAGE_KEY = "memos";

////localStorageからデータを読み込んで、JSON形式から配列に変換する
export function readLocalStorage(key: string): Memo[] {
  const data = localStorage.getItem(key);
  if (data === null) {
    return [];
  } else {
    return JSON.parse(data);
  }
}

export function saveLocalStorage(key: string, data: Memo[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
