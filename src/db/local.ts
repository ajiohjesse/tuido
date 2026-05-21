import { createClient, type Client } from "@libsql/client"
import { getSchema } from "./schema"
import type { List, Todo } from "../utils/types"

export type DbClient = Client

export function createLocalClient(path: string): DbClient {
  return createClient({ url: `file:${path}` })
}

export function initSchema(db: DbClient): Promise<void> {
  return db.executeMultiple(getSchema())
}

export async function getConfig(db: DbClient, key: string): Promise<string | null> {
  const res = await db.execute({ sql: "SELECT value FROM config WHERE key = ?", args: [key] })
  if (res.rows.length === 0) return null
  return res.rows[0]!.value as string
}

export async function setConfig(db: DbClient, key: string, value: string): Promise<void> {
  await db.execute({ sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", args: [key, value] })
}

export async function getSyncMeta(db: DbClient, key: string): Promise<string | null> {
  const res = await db.execute({ sql: "SELECT value FROM sync_meta WHERE key = ?", args: [key] })
  if (res.rows.length === 0) return null
  return res.rows[0]!.value as string
}

export async function setSyncMeta(db: DbClient, key: string, value: string): Promise<void> {
  await db.execute({ sql: "INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)", args: [key, value] })
}

export async function getLists(db: DbClient): Promise<List[]> {
  const res = await db.execute({
    sql: "SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE deleted_at IS NULL ORDER BY updated_at DESC",
  })
  return res.rows.map(mapRowToList)
}

export async function getListById(db: DbClient, id: string): Promise<List | null> {
  const res = await db.execute({
    sql: "SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE id = ?",
    args: [id],
  })
  if (res.rows.length === 0) return null
  return mapRowToList(res.rows[0]!)
}

export async function createList(db: DbClient, id: string, name: string): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "INSERT INTO lists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    args: [id, name, now, now],
  })
}

export async function updateListName(db: DbClient, id: string, name: string): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "UPDATE lists SET name = ?, updated_at = ? WHERE id = ?",
    args: [name, now, id],
  })
}

export async function softDeleteList(db: DbClient, id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "UPDATE lists SET deleted_at = ?, updated_at = ? WHERE id = ?",
    args: [now, now, id],
  })
  await db.execute({
    sql: "UPDATE todos SET deleted_at = ?, updated_at = ? WHERE list_id = ? AND deleted_at IS NULL",
    args: [now, now, id],
  })
}

export async function searchLists(db: DbClient, query: string): Promise<List[]> {
  const res = await db.execute({
    sql: "SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE deleted_at IS NULL AND name LIKE ? ORDER BY updated_at DESC",
    args: [`%${query}%`],
  })
  return res.rows.map(mapRowToList)
}

export async function getTodosByListId(db: DbClient, listId: string): Promise<Todo[]> {
  const res = await db.execute({
    sql: "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos WHERE list_id = ? AND deleted_at IS NULL ORDER BY position ASC, created_at ASC",
    args: [listId],
  })
  return res.rows.map(mapRowToTodo)
}

export async function getTodoById(db: DbClient, id: string): Promise<Todo | null> {
  const res = await db.execute({
    sql: "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos WHERE id = ?",
    args: [id],
  })
  if (res.rows.length === 0) return null
  return mapRowToTodo(res.rows[0]!)
}

export async function createTodo(
  db: DbClient,
  id: string,
  listId: string,
  title: string,
  position: number,
): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "INSERT INTO todos (id, list_id, title, completed, position, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)",
    args: [id, listId, title, position, now, now],
  })
}

export async function toggleTodo(db: DbClient, id: string, completed: number): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "UPDATE todos SET completed = ?, updated_at = ? WHERE id = ?",
    args: [completed, now, id],
  })
}

export async function updateTodoTitle(db: DbClient, id: string, title: string): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "UPDATE todos SET title = ?, updated_at = ? WHERE id = ?",
    args: [title, now, id],
  })
}

export async function softDeleteTodo(db: DbClient, id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.execute({
    sql: "UPDATE todos SET deleted_at = ?, updated_at = ? WHERE id = ?",
    args: [now, now, id],
  })
}

export async function getMaxTodoPosition(db: DbClient, listId: string): Promise<number> {
  const res = await db.execute({
    sql: "SELECT COALESCE(MAX(position), 0) AS max_pos FROM todos WHERE list_id = ? AND deleted_at IS NULL",
    args: [listId],
  })
  return res.rows[0]!.max_pos as number
}

export async function searchTodos(db: DbClient, query: string): Promise<(Todo & { listName: string })[]> {
  const res = await db.execute({
    sql: `SELECT t.id, t.list_id, t.title, t.completed, t.position, t.created_at, t.updated_at, t.deleted_at, l.name as list_name
          FROM todos t JOIN lists l ON t.list_id = l.id
          WHERE t.deleted_at IS NULL AND l.deleted_at IS NULL AND t.title LIKE ?
          ORDER BY t.updated_at DESC`,
    args: [`%${query}%`],
  })
  return res.rows.map((row) => ({
    ...mapRowToTodo(row),
    listName: row.list_name as string,
  }))
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
