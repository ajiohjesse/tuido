import { useKeyboard } from "@opentui/react"
import type { Theme } from "../utils/theme"

interface HelpViewProps {
  theme: Theme
  onClose: () => void
}

export function HelpView({ theme, onClose }: HelpViewProps) {
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "?" || key.name === "q") {
      onClose()
    }
  })

  const shortcuts = [
    { keys: "Tab", desc: "Switch focus between Lists/Todos" },
    { keys: "↑ ↓", desc: "Navigate items (also j/k)" },
    { keys: "Enter", desc: "Select list / toggle todo" },
    { keys: "Space", desc: "Toggle todo check/uncheck" },
    { keys: "n", desc: "Create new list or todo" },
    { keys: "d", desc: "Delete current item" },
    { keys: "r", desc: "Rename current list" },
    { keys: "/", desc: "Toggle search bar" },
    { keys: "o", desc: "Cycle sort order" },
    { keys: "s", desc: "Sync with Turso database" },
    { keys: "c", desc: "Configure Turso sync" },
    { keys: "t", desc: "Cycle theme" },
    { keys: "?", desc: "Toggle this help" },
    { keys: "q / Esc", desc: "Quit application" },
  ]

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
        width={60}
        height={23}
        backgroundColor={theme.surface}
      >
        <box flexDirection="column" gap={1}>
          <text fg={theme.accent}><strong>Keyboard Shortcuts</strong></text>
          <box flexDirection="column" gap={0}>
            {shortcuts.map((s) => (
              <box key={s.keys} flexDirection="row" gap={2}>
                <text width={14} fg={theme.warning}>{s.keys}</text>
                <text fg={theme.text}>{s.desc}</text>
              </box>
            ))}
          </box>
          <box marginTop={1}>
            <text fg={theme.textMuted}>Press Esc, ?, or q to close</text>
          </box>
        </box>
      </box>
    </box>
  )
}
