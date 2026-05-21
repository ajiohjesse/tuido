import type { Todo, SortMode } from "../utils/types"
import type { Theme } from "../utils/theme"

interface TodoItemProps {
  todo: Todo
  isSelected: boolean
  focused: boolean
  theme: Theme
  onToggle: () => void
}

export function TodoItem({ todo, isSelected, focused, theme, onToggle }: TodoItemProps) {
  const titleFg = todo.completed ? theme.textMuted : focused ? theme.text : theme.inactiveText

  return (
    <box
      height={1}
      paddingX={2}
      flexDirection="row"
      backgroundColor={isSelected && focused ? theme.highlightBg : isSelected ? theme.selectionBg : undefined}
    >
      <text fg={isSelected ? theme.selectionFg : focused ? theme.text : theme.inactiveText}>{isSelected ? ">" : " "}</text>
      <text fg={todo.completed ? theme.success : theme.textDim}>{todo.completed ? "\u2611" : "\u2610"}</text>
      <text fg={titleFg}> {todo.title}</text>
    </box>
  )
}

interface TodoPanelProps {
  todos: Todo[]
  selectedIndex: number
  focused: boolean
  sortBy: SortMode
  listName: string | null
  theme: Theme
  onToggle: (id: string, completed: number) => void
  onSelect: (index: number) => void
}

export function TodoPanel({
  todos,
  selectedIndex,
  focused,
  sortBy,
  listName,
  theme,
  onToggle,
  onSelect,
}: TodoPanelProps) {
  const sortLabel = sortBy === "created" ? "by created" : sortBy === "modified" ? "by modified" : "by name"

  return (
    <box flexDirection="column" height="100%">
      <box height={1} paddingX={2} flexDirection="row" gap={1}>
        {listName ? (
          <text fg={theme.text}><strong>{listName}</strong></text>
        ) : (
          <text fg={theme.textMuted}>No list selected</text>
        )}
        <text fg={theme.textDim}>({sortLabel})</text>
      </box>
      <scrollbox flexGrow={1} focused={focused}>
        {!listName ? (
          <box paddingX={2}>
            <text fg={theme.textMuted}>Select a list from the left panel</text>
          </box>
        ) : todos.length === 0 ? (
          <box paddingX={2}>
            <text fg={theme.textMuted}>No todos yet. Press 'n' to add one.</text>
          </box>
        ) : (
          todos.map((todo, i) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isSelected={i === selectedIndex}
              focused={focused}
              theme={theme}
              onToggle={() => onToggle(todo.id, todo.completed)}
            />
          ))
        )}
      </scrollbox>
    </box>
  )
}
