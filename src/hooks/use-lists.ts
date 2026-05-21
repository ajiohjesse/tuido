import { useState, useCallback, useEffect, useRef } from "react"
import type { List, SortMode } from "../utils/types"
import type { DbClient } from "../db/local"
import * as local from "../db/local"
import { generateId } from "../utils/id"
import { todayDateName } from "../utils/helpers"

export function useLists(db: DbClient | null, sortBy: SortMode) {
  const [lists, setLists] = useState<List[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const versionRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!db) return
    const q = searchQuery.trim()
    const data = q ? await local.searchLists(db, q) : await local.getLists(db)
    const sorted = sortLists(data, sortBy)
    setLists(sorted)
    if (sorted.length > 0 && !sorted.find((l) => l.id === selectedListId)) {
      setSelectedListId(sorted[0]!.id)
      setSelectedIndex(0)
    } else if (sorted.length === 0) {
      setSelectedListId(null)
      setSelectedIndex(0)
    }
  }, [db, searchQuery, sortBy, selectedListId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createList = useCallback(async (name: string): Promise<string> => {
    if (!db) return ""
    const id = generateId()
    let listName = name
    if (!listName) {
      const base = todayDateName()
      const count = await local.countListsByNamePattern(db, base)
      listName = count === 0 ? base : `${base} (${count})`
    }
    await local.createList(db, id, listName)
    setSelectedListId(id)
    await refresh()
    return listName
  }, [db, refresh])

  const renameList = useCallback(async (id: string, name: string) => {
    if (!db) return
    await local.updateListName(db, id, name)
    await refresh()
  }, [db, refresh])

  const deleteList = useCallback(async (id: string) => {
    if (!db) return
    await local.softDeleteList(db, id)
    await refresh()
  }, [db, refresh])

  const navigateUp = useCallback(() => {
    if (lists.length === 0) return
    const idx = selectedIndex > 0 ? selectedIndex - 1 : lists.length - 1
    setSelectedIndex(idx)
    setSelectedListId(lists[idx]!.id)
  }, [lists, selectedIndex])

  const navigateDown = useCallback(() => {
    if (lists.length === 0) return
    const idx = (selectedIndex + 1) % lists.length
    setSelectedIndex(idx)
    setSelectedListId(lists[idx]!.id)
  }, [lists, selectedIndex])

  const selectCurrent = useCallback(() => {
    if (lists.length === 0) return null
    return selectedListId
  }, [lists, selectedListId])

  return {
    lists,
    selectedListId,
    selectedIndex,
    searchQuery,
    setSearchQuery,
    setSelectedIndex,
    setSelectedListId,
    createList,
    renameList,
    deleteList,
    navigateUp,
    navigateDown,
    selectCurrent,
    refresh,
  }
}

function sortLists(lists: List[], sortBy: SortMode): List[] {
  const sorted = [...lists]
  switch (sortBy) {
    case "created":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      break
    case "modified":
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      break
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return sorted
}
