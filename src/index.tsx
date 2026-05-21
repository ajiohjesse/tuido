#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"
import { runConfig } from "./cli-config"

async function main() {
  const args = process.argv.slice(2)

  if (args[0] === "config") {
    await runConfig(args.slice(1))
    return
  }

  if (args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    console.log(`
tuido - terminal todo list manager

Usage:
  tuido             Launch the TUI
  tuido config      Show current sync config
  tuido config <url>           Set Turso database URL
  tuido config <url> --token <token>  Set URL and auth token
  tuido config --clear         Clear sync config
  tuido help        Show this help

Environment:
  TURSO_URL         Turso database URL (fallback if not in config)
  TURSO_AUTH_TOKEN  Turso auth token (fallback if not in config)
  TURSO_DB_PATH     Local database path (default: ./data/tuido.db)
`)
    return
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
  })

  const root = createRoot(renderer)
  root.render(<App />)
}

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
