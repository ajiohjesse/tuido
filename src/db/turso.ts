import { createClient, type Client } from "@libsql/client"
export type { Client }
import type { List, Todo } from "../utils/types"

export function createTursoClient(url: string, authToken?: string): Client {
  return createClient({
    url,
    authToken: authToken || process.env.TURSO_AUTH_TOKEN,
  })
}

export async function ensureRemoteSchema(turso: Client): Promise<void> {
  await turso.executeMultiple(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_todos_list_id ON todos(list_id);
  `)
}

export async function pullChanges(
  turso: Client,
  since: string | null,
): Promise<{ lists: List[]; todos: Todo[] }> {
  const listsSql = since
    ? "SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE updated_at > ?"
    : "SELECT id, name, created_at, updated_at, deleted_at FROM lists"

  const todosSql = since
    ? "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos WHERE updated_at > ?"
    : "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos"

  const args = since ? [since] : []

  const [listsRes, todosRes] = await Promise.all([
    turso.execute({ sql: listsSql, args: args as any }),
    turso.execute({ sql: todosSql, args: args as any }),
  ])

  return {
    lists: listsRes.rows.map(mapRowToList),
    todos: todosRes.rows.map(mapRowToTodo),
  }
}

export async function pushLists(turso: Client, lists: List[]): Promise<void> {
  if (lists.length === 0) return
  const stmt = `INSERT OR REPLACE INTO lists (id, name, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)`
  for (const list of lists) {
    await turso.execute({ sql: stmt, args: [list.id, list.name, list.createdAt, list.updatedAt, list.deletedAt] })
  }
}

export async function pushTodos(turso: Client, todos: Todo[]): Promise<void> {
  if (todos.length === 0) return
  const stmt = `INSERT OR REPLACE INTO todos (id, list_id, title, completed, position, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  for (const todo of todos) {
    await turso.execute({
      sql: stmt,
      args: [todo.id, todo.listId, todo.title, todo.completed, todo.position, todo.createdAt, todo.updatedAt, todo.deletedAt],
    })
  }
}

export async function fetchAllRemoteLists(turso: Client): Promise<List[]> {
  const res = await turso.execute("SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE deleted_at IS NULL ORDER BY updated_at DESC")
  return res.rows.map(mapRowToList)
}

export async function fetchAllRemoteTodos(turso: Client, listId: string): Promise<Todo[]> {
  const res = await turso.execute({
    sql: "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos WHERE list_id = ? AND deleted_at IS NULL ORDER BY position ASC, created_at ASC",
    args: [listId],
  })
  return res.rows.map(mapRowToTodo)
}

function mapRowToList(row: any): List {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null,
  }
}

function mapRowToTodo(row: any): Todo {
  return {
    id: row.id as string,
    listId: row.list_id as string,
    title: row.title as string,
    completed: row.completed as number,
    position: row.position as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null,
  }
}
