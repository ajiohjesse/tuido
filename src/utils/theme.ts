import { useState, useEffect, useCallback } from "react"
import type { DbClient } from "../db/local"

export interface Theme {
  name: string
  background: string
  surface: string
  text: string
  textMuted: string
  textDim: string
  accent: string
  destructive: string
  success: string
  warning: string
  border: string
  selectionBg: string
  selectionFg: string
  highlightBg: string
  highlightFg: string
  scrollbarBg: string
  scrollbarFg: string
}

export const dark: Theme = {
  name: "dark",
  background: "#1a1a2e",
  surface: "#1a1a2e",
  text: "#fff",
  textMuted: "#888",
  textDim: "#666",
  accent: "#0ff",
  destructive: "#f44",
  success: "#0f0",
  warning: "#ff0",
  border: "#444",
  selectionBg: "#222",
  selectionFg: "#fff",
  highlightBg: "#1a3a5c",
  highlightFg: "#fff",
  scrollbarBg: "#1a1a2e",
  scrollbarFg: "#555",
}

const highContrast: Theme = {
  name: "high-contrast",
  background: "#fff",
  surface: "#f0f0f0",
  text: "#000",
  textMuted: "#444",
  textDim: "#666",
  accent: "#00f",
  destructive: "#c00",
  success: "#070",
  warning: "#960",
  border: "#000",
  selectionBg: "#ddd",
  selectionFg: "#000",
  highlightBg: "#c0d8ff",
  highlightFg: "#000",
  scrollbarBg: "#f0f0f0",
  scrollbarFg: "#888",
}

const soft: Theme = {
  name: "soft",
  background: "#2a2520",
  surface: "#3a332c",
  text: "#e8dcc8",
  textMuted: "#8a7e72",
  textDim: "#6a6056",
  accent: "#e8a87c",
  destructive: "#d4786a",
  success: "#8ab87a",
  warning: "#d4b06a",
  border: "#4a4038",
  selectionBg: "#4a3f35",
  selectionFg: "#e8dcc8",
  highlightBg: "#5a4c40",
  highlightFg: "#f0e6d0",
  scrollbarBg: "#2a2520",
  scrollbarFg: "#5a4c40",
}

const themes: Theme[] = [dark, highContrast, soft]

export function useTheme(db: DbClient | null) {
  const [idx, setIdx] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!db) { setReady(true); return }
    loadTheme(db).then((i) => { setIdx(i); setReady(true) })
  }, [db])

  const cycleTheme = useCallback(async () => {
    const next = (idx + 1) % themes.length
    setIdx(next)
    if (db) await saveTheme(db, next)
  }, [idx, db])

  return { theme: themes[idx]!, cycleTheme, themeIndex: idx, themeReady: ready }
}

async function loadTheme(db: DbClient): Promise<number> {
  try {
    const { getConfig } = await import("../db/local")
    const saved = await getConfig(db, "theme")
    if (!saved) return 0
    const i = themes.findIndex((t) => t.name === saved)
    return i >= 0 ? i : 0
  } catch {
    return 0
  }
}

async function saveTheme(db: DbClient, index: number): Promise<void> {
  try {
    const { setConfig } = await import("../db/local")
    await setConfig(db, "theme", themes[index]!.name)
  } catch {
    // ignore
  }
}
