import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import type { Theme } from "../utils/theme"

interface SearchBarProps {
  placeholder: string
  theme: Theme
  onSearch: (query: string) => void
  onClose: () => void
}

export function SearchBar({ placeholder, theme, onSearch, onClose }: SearchBarProps) {
  const [value, setValue] = useState("")
  useKeyboard((key) => {
    if (key.name === "escape") {
      onSearch("")
      onClose()
      return
    }
  })

  const handleChange = (v: string) => {
    setValue(v)
    onSearch(v)
  }

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height={3}
      paddingX={1}
      paddingY={0}
      backgroundColor={theme.background}
    >
      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg={theme.accent}><strong>Search:</strong></text>
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          width={40}
          focused
        />
        <text fg={theme.textMuted}>Esc to close</text>
      </box>
    </box>
  )
}
