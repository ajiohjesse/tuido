import type { DbClient } from "./local"
import * as local from "./local"
import * as turso from "./turso"
import type { Client } from "@libsql/client"
import type { List, Todo } from "../utils/types"

export interface SyncResult {
  pulled: { lists: number; todos: number }
  pushed: { lists: number; todos: number }
  errors: string[]
}

export async function syncWithTurso(
  localDb: DbClient,
  tursoClient: Client,
): Promise<SyncResult> {
  const result: SyncResult = { pulled: { lists: 0, todos: 0 }, pushed: { lists: 0, todos: 0 }, errors: [] }

  try {
    await turso.ensureRemoteSchema(tursoClient)
  } catch (e) {
    result.errors.push(`Failed to ensure remote schema: ${String(e)}`)
    return result
  }

  const lastSync = await local.getSyncMeta(localDb, "last_sync_at")
  const since = lastSync

  let remoteLists: List[] = []
  let remoteTodos: Todo[] = []

  try {
    const pulled = await turso.pullChanges(tursoClient, since)
    remoteLists = pulled.lists
    remoteTodos = pulled.todos
    result.pulled.lists = remoteLists.length
    result.pulled.todos = remoteTodos.length
  } catch (e) {
    result.errors.push(`Failed to pull from remote: ${String(e)}`)
  }

  const now = new Date().toISOString()
  const localSince = since || "1970-01-01T00:00:00.000Z"

  let localChangedLists: List[] = []
  let localChangedTodos: Todo[] = []

  try {
    const res = await localDb.execute({
      sql: "SELECT id, name, created_at, updated_at, deleted_at FROM lists WHERE updated_at > ?",
      args: [localSince],
    })
    localChangedLists = res.rows.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      deletedAt: row.deleted_at as string | null,
    }))

    const todoRes = await localDb.execute({
      sql: "SELECT id, list_id, title, completed, position, created_at, updated_at, deleted_at FROM todos WHERE updated_at > ?",
      args: [localSince],
    })
    localChangedTodos = todoRes.rows.map((row: any) => ({
      id: row.id as string,
      listId: row.list_id as string,
      title: row.title as string,
      completed: row.completed as number,
      position: row.position as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      deletedAt: row.deleted_at as string | null,
    }))
  } catch (e) {
    result.errors.push(`Failed to read local changes: ${String(e)}`)
  }

  const reconciledLists = reconcileLists(remoteLists, localChangedLists)
  const reconciledTodos = reconcileTodos(remoteTodos, localChangedTodos)

  for (const list of reconciledLists.listsToUpsert) {
    try {
      await localDb.execute({
        sql: "INSERT OR REPLACE INTO lists (id, name, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)",
        args: [list.id, list.name, list.createdAt, list.updatedAt, list.deletedAt],
      })
    } catch (e) {
      result.errors.push(`Failed to upsert list ${list.id}: ${String(e)}`)
    }
  }

  for (const todo of reconciledTodos.todosToUpsert) {
    try {
      await localDb.execute({
        sql: "INSERT OR REPLACE INTO todos (id, list_id, title, completed, position, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [todo.id, todo.listId, todo.title, todo.completed, todo.position, todo.createdAt, todo.updatedAt, todo.deletedAt],
      })
    } catch (e) {
      result.errors.push(`Failed to upsert todo ${todo.id}: ${String(e)}`)
    }
  }

  try {
    if (reconciledLists.listsToPush.length > 0) {
      await turso.pushLists(tursoClient, reconciledLists.listsToPush)
      result.pushed.lists = reconciledLists.listsToPush.length
    }
    if (reconciledTodos.todosToPush.length > 0) {
      await turso.pushTodos(tursoClient, reconciledTodos.todosToPush)
      result.pushed.todos = reconciledTodos.todosToPush.length
    }
  } catch (e) {
    result.errors.push(`Failed to push to remote: ${String(e)}`)
  }

  try {
    await local.setSyncMeta(localDb, "last_sync_at", now)
  } catch (e) {
    result.errors.push(`Failed to update sync meta: ${String(e)}`)
  }

  return result
}

interface ReconciledLists {
  listsToUpsert: List[]
  listsToPush: List[]
}

interface ReconciledTodos {
  todosToUpsert: Todo[]
  todosToPush: Todo[]
}

function reconcileLists(remote: List[], local: List[]): ReconciledLists {
  const localMap = new Map<string, List>()
  for (const l of local) localMap.set(l.id, l)

  const upsertedIds = new Set<string>()
  const toUpsert: List[] = []
  const toPush: List[] = []

  for (const r of remote) {
    const local = localMap.get(r.id)
    if (!local) {
      toUpsert.push(r)
      upsertedIds.add(r.id)
    } else if (r.updatedAt > local.updatedAt) {
      toUpsert.push(r)
      upsertedIds.add(r.id)
    } else if (local.updatedAt > r.updatedAt) {
      toPush.push(local)
      upsertedIds.add(local.id)
    }
  }

  for (const l of local) {
    if (!upsertedIds.has(l.id)) {
      toPush.push(l)
    }
  }

  return { listsToUpsert: toUpsert, listsToPush: toPush }
}

function reconcileTodos(remote: Todo[], local: Todo[]): ReconciledTodos {
  const localMap = new Map<string, Todo>()
  for (const t of local) localMap.set(t.id, t)

  const upsertedIds = new Set<string>()
  const toUpsert: Todo[] = []
  const toPush: Todo[] = []

  for (const r of remote) {
    const local = localMap.get(r.id)
    if (!local) {
      toUpsert.push(r)
      upsertedIds.add(r.id)
    } else if (r.updatedAt > local.updatedAt) {
      toUpsert.push(r)
      upsertedIds.add(r.id)
    } else if (local.updatedAt > r.updatedAt) {
      toPush.push(local)
      upsertedIds.add(local.id)
    }
  }

  for (const l of local) {
    if (!upsertedIds.has(l.id)) {
      toPush.push(l)
    }
  }

  return { todosToUpsert: toUpsert, todosToPush: toPush }
}

export async function configureTursoUrl(
  localDb: DbClient,
  url: string,
): Promise<void> {
  await local.setConfig(localDb, "turso_url", url)
}

export async function getTursoUrl(localDb: DbClient): Promise<string | null> {
  const fromDb = await local.getConfig(localDb, "turso_url")
  if (fromDb) return fromDb
  return process.env.TURSO_URL ?? null
}

export async function configureTursoAuth(
  localDb: DbClient,
  token: string,
): Promise<void> {
  await local.setConfig(localDb, "turso_auth_token", token)
}

export async function getTursoAuth(localDb: DbClient): Promise<string | null> {
  const fromDb = await local.getConfig(localDb, "turso_auth_token")
  if (fromDb) return fromDb
  return process.env.TURSO_AUTH_TOKEN ?? null
}

export async function configureTurso(
  localDb: DbClient,
  url: string,
  token?: string,
): Promise<void> {
  await configureTursoUrl(localDb, url)
  if (token) {
    await configureTursoAuth(localDb, token)
  }
}
