import { mkdirSync } from "node:fs"
import { createLocalClient, initSchema, getConfig, setConfig } from "./db/local"

const CONFIG_KEYS = {
  url: "turso_url",
  token: "turso_auth_token",
} as const

export async function runConfig(argv: string[]): Promise<void> {
  const dbPath = process.env.TURSO_DB_PATH || "./data/tuido.db"
  const dir = dbPath.split("/").slice(0, -1).join("/")
  if (dir) mkdirSync(dir, { recursive: true })

  const db = createLocalClient(dbPath)
  await initSchema(db)

  const cmd = argv[0]

  if (cmd === "--clear" || cmd === "clear") {
    await setConfig(db, CONFIG_KEYS.url, "")
    await setConfig(db, CONFIG_KEYS.token, "")
    console.log("Config cleared")
    await db.close()
    return
  }

  if (!cmd || cmd === "show" || cmd === "--show") {
    const url = await getConfig(db, CONFIG_KEYS.url)
    const token = await getConfig(db, CONFIG_KEYS.token)
    console.log("Turso URL:", url || "(not set)")
    console.log("Auth token:", token ? "(set)" : "(not set)")
    if (process.env.TURSO_URL) console.log("TURSO_URL env:", process.env.TURSO_URL)
    if (process.env.TURSO_AUTH_TOKEN) console.log("TURSO_AUTH_TOKEN env: (set)")
    await db.close()
    return
  }

  const url = cmd
  const tokenIdx = argv.indexOf("--token")
  const token = tokenIdx !== -1 ? argv[tokenIdx + 1] : undefined

  await setConfig(db, CONFIG_KEYS.url, url)
  if (token) {
    await setConfig(db, CONFIG_KEYS.token, token)
  }

  console.log(`Turso URL set to: ${url}`)
  if (token) console.log("Auth token stored")
  else console.log("No token provided (use TURSO_AUTH_TOKEN env var or re-run with --token)")

  await db.close()
}
