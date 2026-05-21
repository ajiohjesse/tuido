import { useState, useCallback, useEffect, useRef } from "react"
import type { Todo, SortMode } from "../utils/types"
import type { DbClient } from "../db/local"
import * as local from "../db/local"
import { generateId } from "../utils/id"

export function useTodos(db: DbClient | null, listId: string | null, sortBy: SortMode) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const previousListId = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!db || !listId) {
      setTodos([])
      return
    }
    const q = searchQuery.trim()
    const data = await local.getTodosByListId(db, listId)
    const filtered = q ? data.filter((t) => t.title.toLowerCase().includes(q.toLowerCase())) : data
    const sorted = sortTodos(filtered, sortBy)
    setTodos(sorted)
    if (selectedIndex >= sorted.length) {
      setSelectedIndex(Math.max(0, sorted.length - 1))
    }
  }, [db, listId, sortBy, selectedIndex, searchQuery])

  useEffect(() => {
    if (previousListId.current !== listId) {
      setSelectedIndex(0)
      previousListId.current = listId
    }
    refresh()
  }, [listId, refresh])

  const addTodo = useCallback(async (title: string) => {
    if (!db || !listId) return
    const maxPos = await local.getMaxTodoPosition(db, listId)
    const id = generateId()
    await local.createTodo(db, id, listId, title, maxPos + 1)
    await refresh()
  }, [db, listId, refresh])

  const toggleTodo = useCallback(async (id: string, currentCompleted: number) => {
    if (!db) return
    await local.toggleTodo(db, id, currentCompleted ? 0 : 1)
    await refresh()
  }, [db, refresh])

  const deleteTodo = useCallback(async (id: string) => {
    if (!db) return
    await local.softDeleteTodo(db, id)
    await refresh()
  }, [db, refresh])

  const navigateUp = useCallback(() => {
    if (todos.length === 0) return
    setSelectedIndex((i) => (i > 0 ? i - 1 : todos.length - 1))
  }, [todos])

  const navigateDown = useCallback(() => {
    if (todos.length === 0) return
    setSelectedIndex((i) => (i + 1) % todos.length)
  }, [todos])

  return {
    todos,
    selectedIndex,
    setSelectedIndex,
    searchQuery,
    setSearchQuery,
    addTodo,
    toggleTodo,
    deleteTodo,
    navigateUp,
    navigateDown,
    refresh,
  }
}

function sortTodos(todos: Todo[], sortBy: SortMode): Todo[] {
  const sorted = [...todos]
  switch (sortBy) {
    case "created":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      break
    case "modified":
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      break
    case "name":
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
  }
  return sorted
}
