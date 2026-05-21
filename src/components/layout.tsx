import type { ReactNode } from "react"
import type { Theme } from "../utils/theme"

interface LayoutProps {
  header: ReactNode
  leftPanel: ReactNode
  rightPanel: ReactNode
  footer: ReactNode
  overlay?: ReactNode
  theme: Theme
}

export function Layout({ header, leftPanel, rightPanel, footer, overlay, theme }: LayoutProps) {
  return (
    <box width="100%" height="100%" flexDirection="column">
      {header}
      <box flexDirection="row" flexGrow={1}>
        <box width={28} border={["right"]} borderColor={theme.border}>
          {leftPanel}
        </box>
        <box flexGrow={1}>
          {rightPanel}
        </box>
      </box>
      {footer}
      {overlay}
    </box>
  )
}

interface HeaderProps {
  theme: Theme
}

export function Header({ theme }: HeaderProps) {
  return (
    <box height={1} paddingX={1}>
      <text fg={theme.accent}>
        <strong> ▌ tuido ▐</strong>
      </text>
    </box>
  )
}
