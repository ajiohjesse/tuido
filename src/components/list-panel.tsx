import type { List, SortMode } from "../utils/types"
import type { Theme } from "../utils/theme"
import { formatDate, isAutoNamed } from "../utils/helpers"

interface ListPanelProps {
  lists: List[]
  selectedIndex: number
  selectedListId: string | null
  focused: boolean
  sortBy: SortMode
  searchQuery: string
  theme: Theme
  onSelect: (id: string, index: number) => void
}

export function ListPanel({
  lists,
  selectedIndex,
  selectedListId,
  focused,
  sortBy,
  searchQuery,
  theme,
  onSelect,
}: ListPanelProps) {
  const sortLabel = sortBy === "created" ? "by created" : sortBy === "modified" ? "by modified" : "by name"

  return (
    <box flexDirection="column" height="100%">
      <box height={1} paddingX={1} flexDirection="row" gap={1}>
        <text fg={theme.accent}><strong>Lists</strong></text>
        <text fg={theme.textDim}>({sortLabel})</text>
      </box>
      <scrollbox flexGrow={1} focused={focused}>
        {lists.length === 0 ? (
          <box paddingX={1}>
            <text fg={theme.textMuted}>
              {searchQuery ? "No lists match search" : "No lists yet. Press 'n' to create one."}
            </text>
          </box>
        ) : (
          lists.map((list, i) => {
            const isSelected = i === selectedIndex && list.id === selectedListId
            const bg = isSelected && focused ? theme.highlightBg : isSelected ? theme.selectionBg : undefined
            const fg = isSelected ? theme.selectionFg : theme.textMuted
            const showDate = !isAutoNamed(list.name)
            return (
              <box key={list.id} height={showDate ? 2 : 1} paddingX={1} flexDirection="column" backgroundColor={bg}>
                <text fg={fg}>
                  {isSelected ? ">" : " "} {isSelected ? <strong>{list.name}</strong> : list.name}
                </text>
                {showDate && (
                  <text fg={theme.textDim}>
                    {" ".repeat(isSelected ? 3 : 2)}{formatDate(list.createdAt)}
                  </text>
                )}
              </box>
            )
          })
        )}
      </scrollbox>
    </box>
  )
}
