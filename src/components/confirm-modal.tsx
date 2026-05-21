import { useKeyboard } from "@opentui/react"
import type { Theme } from "../utils/theme"

interface ConfirmModalProps {
  title: string
  message: string
  theme: Theme
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ title, message, theme, onConfirm, onCancel }: ConfirmModalProps) {
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "n") {
      onCancel()
      return
    }
    if (key.name === "enter" || key.name === "y") {
      onConfirm()
      return
    }
  })

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
        borderColor={theme.destructive}
        padding={2}
        width={50}
        backgroundColor={theme.surface}
      >
        <box flexDirection="column" gap={1}>
          <text fg={theme.destructive}><strong>{title}</strong></text>
          <text fg={theme.text}>{message}</text>
          <box flexDirection="row" gap={2}>
            <text fg={theme.textMuted}>Y/Enter: confirm</text>
            <text fg={theme.textMuted}>N/Esc: cancel</text>
          </box>
        </box>
      </box>
    </box>
  )
}
