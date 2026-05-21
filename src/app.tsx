import { useState, useCallback } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { useDB } from "./hooks/use-db"
import { useLists } from "./hooks/use-lists"
import { useTodos } from "./hooks/use-todos"
import { Layout, Header } from "./components/layout"
import { ListPanel } from "./components/list-panel"
import { TodoPanel } from "./components/todo-panel"
import { StatusBar } from "./components/status-bar"
import { CreateModal } from "./components/create-modal"
import { ConfirmModal } from "./components/confirm-modal"
import { RenameModal } from "./components/rename-modal"
import { HelpView } from "./components/help-view"
import { SearchBar } from "./components/search-bar"
import { ConfigSyncModal } from "./components/config-sync-modal"
import { syncWithTurso } from "./db/sync"
import { useTheme, type Theme } from "./utils/theme"
import type { FocusPanel, SortMode } from "./utils/types"

type ModalType = "create-list" | "create-todo" | "rename-list" | "confirm-delete-list" | "confirm-delete-todo" | "help" | "search" | "config-sync" | null

export function App() {
  const renderer = useRenderer()
  const { db, tursoClient, tursoUrl, ready, setTursoUrl } = useDB()
  const { cycleTheme, theme } = useTheme(db)
  const [focusPanel, setFocusPanel] = useState<FocusPanel>("lists")
  const [sortBy, setSortBy] = useState<SortMode>("modified")
  const [modal, setModal] = useState<ModalType>(null)
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined)

  const listsHook = useLists(db, sortBy)
  const todosHook = useTodos(db, listsHook.selectedListId, sortBy)

  const selectedList = listsHook.lists.find((l) => l.id === listsHook.selectedListId)

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(undefined), 3000)
  }, [])

  const getSelectedTodo = useCallback(() => {
    if (focusPanel !== "todos" || !todosHook.todos[todosHook.selectedIndex]) return null
    return todosHook.todos[todosHook.selectedIndex]!
  }, [focusPanel, todosHook.todos, todosHook.selectedIndex])

  const getSelectedList = useCallback(() => {
    if (focusPanel !== "lists" || !listsHook.lists[listsHook.selectedIndex]) return null
    return listsHook.lists[listsHook.selectedIndex]!
  }, [focusPanel, listsHook.lists, listsHook.selectedIndex])

  useKeyboard((key) => {
    if (modal) return

    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      renderer.destroy()
      return
    }

    if (key.name === "q") {
      renderer.destroy()
      return
    }

    if (key.name === "tab") {
      setFocusPanel((p) => (p === "lists" ? "todos" : "lists"))
      return
    }

    if (key.name === "o") {
      setSortBy((s) => {
        if (s === "modified") return "created"
        if (s === "created") return "name"
        return "modified"
      })
      return
    }

    if (key.name === "?") {
      setModal("help")
      return
    }

    if (key.name === "/") {
      setModal("search")
      return
    }

    if (key.name === "n") {
      if (focusPanel === "lists" || (!listsHook.selectedListId)) {
        setModal("create-list")
      } else {
        setModal("create-todo")
      }
      return
    }

    if (key.name === "c") {
      setModal("config-sync")
      return
    }

    if (key.name === "s") {
      if (tursoClient) {
        triggerSync()
      } else {
        showStatus("No sync configured. Press 'c' to set up.")
      }
      return
    }

    if (key.name === "t") {
      cycleTheme()
      showStatus(`Theme: ${theme.name}`)
      return
    }

    if (focusPanel === "lists") {
      if (key.name === "up" || key.name === "k") {
        listsHook.navigateUp()
        return
      }
      if (key.name === "down" || key.name === "j") {
        listsHook.navigateDown()
        return
      }
      if (key.name === "enter") {
        listsHook.selectCurrent()
        return
      }
      if (key.name === "r") {
        const list = getSelectedList()
        if (list) setModal("rename-list")
        return
      }
      if (key.name === "d") {
        const list = getSelectedList()
        if (list) setModal("confirm-delete-list")
        return
      }
    }

    if (focusPanel === "todos") {
      if (key.name === "up" || key.name === "k") {
        todosHook.navigateUp()
        return
      }
      if (key.name === "down" || key.name === "j") {
        todosHook.navigateDown()
        return
      }
      if (key.name === "enter" || key.name === "space") {
        const todo = getSelectedTodo()
        if (todo) todosHook.toggleTodo(todo.id, todo.completed)
        return
      }
      if (key.name === "d") {
        const todo = getSelectedTodo()
        if (todo) setModal("confirm-delete-todo")
        return
      }
    }
  })

  const triggerSync = useCallback(async () => {
    if (!db || !tursoClient) return
    showStatus("Syncing...")
    try {
      const result = await syncWithTurso(db, tursoClient)
      if (result.errors.length > 0) {
        showStatus(`Sync finished with ${result.errors.length} error(s)`)
      } else {
        showStatus(`Synced! Pulled ${result.pulled.lists} lists, ${result.pulled.todos} todos`)
      }
      listsHook.refresh()
      if (listsHook.selectedListId) todosHook.refresh()
    } catch (e) {
      showStatus(`Sync failed: ${String(e)}`)
    }
  }, [db, tursoClient, showStatus, listsHook, todosHook])

  const handleCreateList = useCallback(async (name: string) => {
    await listsHook.createList(name)
    setModal(null)
    showStatus(`Created list "${name}"`)
  }, [listsHook, showStatus])

  const handleCreateTodo = useCallback(async (title: string) => {
    await todosHook.addTodo(title)
    setModal(null)
    showStatus(`Added todo "${title}"`)
  }, [todosHook, showStatus])

  const handleRenameList = useCallback(async (name: string) => {
    const list = getSelectedList()
    if (list) {
      await listsHook.renameList(list.id, name)
      showStatus(`Renamed list to "${name}"`)
    }
    setModal(null)
  }, [listsHook, getSelectedList, showStatus])

  const handleDeleteList = useCallback(async () => {
    const list = getSelectedList()
    if (list) {
      await listsHook.deleteList(list.id)
      showStatus(`Deleted list "${list.name}"`)
    }
    setModal(null)
  }, [listsHook, getSelectedList, showStatus])

  const handleDeleteTodo = useCallback(async () => {
    const todo = getSelectedTodo()
    if (todo) {
      await todosHook.deleteTodo(todo.id)
      showStatus(`Deleted todo`)
    }
    setModal(null)
  }, [todosHook, getSelectedTodo, showStatus])

  const handleConfigSave = useCallback(async (url: string, token?: string) => {
    await setTursoUrl(url, token)
    setModal(null)
    showStatus(url ? "Sync URL configured" : "Sync config cleared")
  }, [setTursoUrl, showStatus])

  if (!ready) {
    return (
      <box width="100%" height="100%" justifyContent="center" alignItems="center">
        <text>Initializing...</text>
      </box>
    )
  }

  const overlay = renderModal(modal, {
    listsHook,
    todosHook,
    selectedList,
    getSelectedList,
    getSelectedTodo,
    tursoUrl,
    theme,
    onClose: () => setModal(null),
    onCreateList: handleCreateList,
    onCreateTodo: handleCreateTodo,
    onRenameList: handleRenameList,
    onDeleteList: handleDeleteList,
    onDeleteTodo: handleDeleteTodo,
    onConfigSave: handleConfigSave,
  })

  return (
    <Layout
      header={<Header theme={theme} />}
      leftPanel={
        <ListPanel
          lists={listsHook.lists}
          selectedIndex={listsHook.selectedIndex}
          selectedListId={listsHook.selectedListId}
          focused={focusPanel === "lists"}
          sortBy={sortBy}
          searchQuery={listsHook.searchQuery}
          theme={theme}
          onSelect={(id, index) => {
            listsHook.setSelectedListId(id)
            listsHook.setSelectedIndex(index)
          }}
        />
      }
      rightPanel={
        <TodoPanel
          todos={todosHook.todos}
          selectedIndex={todosHook.selectedIndex}
          focused={focusPanel === "todos"}
          sortBy={sortBy}
          listName={selectedList?.name ?? null}
          theme={theme}
          onToggle={(id, completed) => todosHook.toggleTodo(id, completed)}
          onSelect={(index) => todosHook.setSelectedIndex(index)}
        />
      }
      footer={
        <StatusBar
          focusPanel={focusPanel}
          syncConfigured={!!tursoUrl}
          hasLists={listsHook.lists.length > 0}
          hasTodos={todosHook.todos.length > 0}
          theme={theme}
          themeName={theme.name}
          message={statusMessage}
        />
      }
      overlay={overlay}
      theme={theme}
    />
  )
}

interface ModalContext {
  listsHook: ReturnType<typeof useLists>
  todosHook: ReturnType<typeof useTodos>
  selectedList: { id: string; name: string } | undefined
  getSelectedList: () => { id: string; name: string } | null
  getSelectedTodo: () => { id: string; title: string; completed: number } | null
  tursoUrl: string | null
  theme: Theme
  onClose: () => void
  onCreateList: (name: string) => Promise<void>
  onCreateTodo: (title: string) => Promise<void>
  onRenameList: (name: string) => Promise<void>
  onDeleteList: () => Promise<void>
  onDeleteTodo: () => Promise<void>
  onConfigSave: (url: string, token?: string) => void
}

function renderModal(modal: ModalType, ctx: ModalContext) {
  switch (modal) {
    case "create-list":
      return (
        <CreateModal
          title="Create New List"
          placeholder="List name..."
          theme={ctx.theme}
          onSubmit={ctx.onCreateList}
          onCancel={ctx.onClose}
        />
      )
    case "create-todo":
      return (
        <CreateModal
          title={`Add Todo to "${ctx.selectedList?.name ?? ""}"`}
          placeholder="Todo title..."
          theme={ctx.theme}
          onSubmit={ctx.onCreateTodo}
          onCancel={ctx.onClose}
        />
      )
    case "rename-list": {
      const list = ctx.getSelectedList()
      if (!list) return null
      return (
        <RenameModal
          title={`Rename "${list.name}"`}
          currentName={list.name}
          theme={ctx.theme}
          onSubmit={ctx.onRenameList}
          onCancel={ctx.onClose}
        />
      )
    }
    case "confirm-delete-list": {
      const list = ctx.getSelectedList()
      if (!list) return null
      return (
        <ConfirmModal
          title="Delete List"
          message={`Permanently delete "${list.name}" and all its todos?`}
          theme={ctx.theme}
          onConfirm={ctx.onDeleteList}
          onCancel={ctx.onClose}
        />
      )
    }
    case "confirm-delete-todo": {
      const todo = ctx.getSelectedTodo()
      if (!todo) return null
      return (
        <ConfirmModal
          title="Delete Todo"
          message={`Delete "${todo.title}"?`}
          theme={ctx.theme}
          onConfirm={ctx.onDeleteTodo}
          onCancel={ctx.onClose}
        />
      )
    }
    case "help":
      return <HelpView theme={ctx.theme} onClose={ctx.onClose} />
    case "search":
      return (
        <SearchBar
          placeholder={ctx.listsHook.selectedListId ? "Search todos..." : "Search lists..."}
          theme={ctx.theme}
          onSearch={(q) => {
            if (ctx.listsHook.selectedListId) {
              ctx.todosHook.setSearchQuery(q)
            } else {
              ctx.listsHook.setSearchQuery(q)
            }
          }}
          onClose={ctx.onClose}
        />
      )
    case "config-sync":
      return (
        <ConfigSyncModal
          currentUrl={ctx.tursoUrl}
          theme={ctx.theme}
          onSave={ctx.onConfigSave}
          onClear={() => ctx.onConfigSave("")}
          onCancel={ctx.onClose}
        />
      )
    default:
      return null
  }
}
