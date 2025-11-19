export type Memo = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  order: number;
};

export type CreateMemoInput = {
  title: string;
  body: string;
};

export type UpdateMemoInput = {
  title?: string;
  body?: string;
};

export type ReorderInput = {
  orderedIds: string[];
};
