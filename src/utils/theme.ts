import { useState, useEffect, useCallback } from "react"
import type { DbClient } from "../db/local"

export interface Theme {
  name: string
  background: string
  surface: string
  text: string
  textMuted: string
  textDim: string
  inactiveText: string
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

const kanagawa: Theme = {
  name: "kanagawa",
  background: "#1A1A22",
  surface: "#22222E",
  text: "#DCD7BA",
  textMuted: "#727169",
  textDim: "#54546D",
  inactiveText: "#383840",
  accent: "#FF9E3B",
  destructive: "#C34043",
  success: "#76946A",
  warning: "#DCA561",
  border: "#363646",
  selectionBg: "#2D2D3A",
  selectionFg: "#DCD7BA",
  highlightBg: "#5C3A1A",
  highlightFg: "#FFD9A3",
  scrollbarBg: "#1A1A22",
  scrollbarFg: "#54546D",
}

const rosePine: Theme = {
  name: "rose-pine",
  background: "#191724",
  surface: "#1F1D2E",
  text: "#E0DEF4",
  textMuted: "#908CAA",
  textDim: "#6E6A86",
  inactiveText: "#36334A",
  accent: "#EB6F92",
  destructive: "#EB6F92",
  success: "#31748F",
  warning: "#F6C177",
  border: "#26233A",
  selectionBg: "#26233A",
  selectionFg: "#E0DEF4",
  highlightBg: "#422B3A",
  highlightFg: "#F4CDE0",
  scrollbarBg: "#191724",
  scrollbarFg: "#6E6A86",
}

const emerald: Theme = {
  name: "emerald",
  background: "#0A0A0A",
  surface: "#141414",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  textDim: "#707070",
  inactiveText: "#303030",
  accent: "#00C853",
  destructive: "#FF1744",
  success: "#00E676",
  warning: "#FFD600",
  border: "#2A2A2A",
  selectionBg: "#1A1A1A",
  selectionFg: "#FFFFFF",
  highlightBg: "#103A1E",
  highlightFg: "#A5FFC0",
  scrollbarBg: "#0A0A0A",
  scrollbarFg: "#707070",
}

const themes: Theme[] = [kanagawa, rosePine, emerald]

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
