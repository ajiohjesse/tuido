import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import type { Theme } from "../utils/theme"

interface ConfigSyncModalProps {
  currentUrl: string | null
  theme: Theme
  onSave: (url: string, token?: string) => void
  onClear: () => void
  onCancel: () => void
}

export function ConfigSyncModal({ currentUrl, theme, onSave, onClear, onCancel }: ConfigSyncModalProps) {
  const [url, setUrl] = useState(currentUrl || "")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  useKeyboard((key) => {
    if (key.name === "escape") {
      onCancel()
    }
  })

  const handleSaveUrl = (v: any) => {
    const val = typeof v === "string" ? v : ""
    if (val.trim()) {
      setUrl(val.trim())
      setShowToken(true)
    } else {
      onClear()
    }
  }

  const handleSaveToken = (v: any) => {
    const val = typeof v === "string" ? v : ""
    onSave(url.trim(), val.trim() || undefined)
  }

  if (showToken) {
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
          backgroundColor={theme.surface}
        >
          <box flexDirection="column" gap={1}>
            <text fg={theme.accent}><strong>Turso Auth Token (optional)</strong></text>
            <text fg={theme.textMuted}>Paste your database auth token:</text>
            <input
              value={token}
              onChange={setToken}
              onSubmit={handleSaveToken}
              placeholder="eyJhbGciOi... (or leave empty)"
              focused
            />
            <text fg={theme.textDim}>Leave empty if using TURSO_AUTH_TOKEN env var</text>
            <text fg={theme.textDim}>Token is stored in local config DB</text>
            <box flexDirection="row" gap={2}>
              <text fg={theme.textMuted}>Enter: save</text>
              <text fg={theme.textMuted}>Esc: cancel</text>
            </box>
          </box>
        </box>
      </box>
    )
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
        width={60}
        backgroundColor={theme.surface}
      >
        <box flexDirection="column" gap={1}>
          <text fg={theme.accent}><strong>Configure Turso Sync</strong></text>
          <text fg={theme.textMuted}>Enter your Turso database URL (libsql://...):</text>
          <input
            value={url}
            onChange={setUrl}
            onSubmit={handleSaveUrl}
            placeholder="libsql://your-db.turso.io"
            focused
          />
          <text fg={theme.textDim}>Leave empty and press Enter to clear config</text>
          <box flexDirection="row" gap={2}>
            <text fg={theme.textMuted}>Enter: configure token</text>
            <text fg={theme.textMuted}>Esc: cancel</text>
          </box>
        </box>
      </box>
    </box>
  )
}
