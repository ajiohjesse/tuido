import type { Theme } from "../utils/theme"
import type { FocusPanel } from "../utils/types"

interface StatusBarProps {
  focusPanel: FocusPanel
  syncConfigured: boolean
  hasLists: boolean
  hasTodos: boolean
  theme: Theme
  themeName: string
  message?: string
}

export function StatusBar({ focusPanel, syncConfigured, hasLists, hasTodos, theme, themeName, message }: StatusBarProps) {
  return (
    <box height={1} paddingX={1} backgroundColor={theme.background} flexDirection="row">
      <text fg={theme.textMuted}>
        <strong> {focusPanel === "lists" ? "Lists" : "Todos"}</strong>
      </text>
      <text fg={theme.textDim}> |↑↓ </text>
      {hasLists ? <text fg={theme.textDim}>n d </text> : null}
      {hasLists && focusPanel === "lists" ? <text fg={theme.textDim}>r </text> : null}
      {hasTodos ? <text fg={theme.textDim}>Space/ </text> : null}
      <text fg={theme.textDim}>o </text>
      {syncConfigured ? <text fg={theme.textDim}>s </text> : <text fg={theme.textDim}>c </text>}
      <text fg={theme.textDim}>t ? </text>
      <text fg={theme.textDim}>q</text>

      <box flexGrow={1} />

      {syncConfigured ? (
        <text fg={theme.success}>
          <strong> ●sync</strong>
        </text>
      ) : null}

      <text fg={theme.accent}>
        <strong> {themeName}</strong>
      </text>

      {message ? (
        <text fg={theme.warning}>
          <strong> {message}</strong>
        </text>
      ) : null}
    </box>
  )
}
