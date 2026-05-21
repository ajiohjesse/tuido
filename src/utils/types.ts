export interface List {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Todo {
  id: string
  listId: string
  title: string
  completed: number
  position: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type SortMode = "created" | "modified" | "name"

export type FocusPanel = "lists" | "todos"

export interface ModalState {
  type: "create-list" | "create-todo" | "rename-list" | "confirm-delete-list" | "confirm-delete-todo" | "help" | "search" | "config-sync"
}
