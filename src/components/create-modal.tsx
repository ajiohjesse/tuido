import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import type { Theme } from "../utils/theme"

interface CreateModalProps {
  title: string
  placeholder: string
  theme: Theme
  allowEmpty?: boolean
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function CreateModal({ title, placeholder, theme, allowEmpty, onSubmit, onCancel }: CreateModalProps) {
  const [value, setValue] = useState("")
  useKeyboard((key) => {
    if (key.name === "escape") {
      onCancel()
    }
  })

  const handleSubmit = (v: any) => {
    const val = typeof v === "string" ? v : ""
    if (allowEmpty) {
      onSubmit(val.trim())
    } else if (val.trim()) {
      onSubmit(val.trim())
    }
  }

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <box
        border
        borderStyle="double"
        borderColor={theme.accent}
        padding={2}
        width={50}
        backgroundColor={theme.surface}
      >
        <box flexDirection="column" gap={1}>
          <text fg={theme.accent}><strong>{title}</strong></text>
          <input
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            focused
          />
          <box flexDirection="row" gap={2}>
            <text fg={theme.textMuted}>Enter: submit</text>
            <text fg={theme.textMuted}>Esc: cancel</text>
          </box>
        </box>
      </box>
    </box>
  )
}
