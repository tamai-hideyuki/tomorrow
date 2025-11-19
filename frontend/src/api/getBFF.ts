import { Memo } from '../types';

type CreateMemoInput = {
  title: string;
  body: string;
};

type UpdateMemoInput = {
  title?: string;
  body?: string;
};

type ReorderInput = {
  orderedIds: string[];
};

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const getBFF = {
  memos: {
    getAll: async (): Promise<Memo[]> => {
      const response = await fetch(`${API_BASE}/memos`);
      return handleResponse<Memo[]>(response);
    },

    getOne: async (id: string): Promise<Memo> => {
      const response = await fetch(`${API_BASE}/memos/${id}`);
      return handleResponse<Memo>(response);
    },

    create: async (input: CreateMemoInput): Promise<Memo> => {
      const response = await fetch(`${API_BASE}/memos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      return handleResponse<Memo>(response);
    },

    update: async (id: string, input: UpdateMemoInput): Promise<Memo> => {
      const response = await fetch(`${API_BASE}/memos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      return handleResponse<Memo>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/memos/${id}`, {
        method: 'DELETE',
      });
      await handleResponse<{ success: boolean }>(response);
    },

    reorder: async (orderedIds: string[]): Promise<Memo[]> => {
      const response = await fetch(`${API_BASE}/memos/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds } as ReorderInput),
      });
      return handleResponse<Memo[]>(response);
    },
  },
};
