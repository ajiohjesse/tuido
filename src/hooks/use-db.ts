import { useEffect, useState, useCallback } from "react"
import { mkdirSync } from "node:fs"
import { createLocalClient, initSchema, setConfig, type DbClient } from "../db/local"
import { createTursoClient, type Client } from "../db/turso"
import { getTursoUrl, getTursoAuth, configureTurso } from "../db/sync"

export interface DbState {
  db: DbClient | null
  tursoClient: Client | null
  tursoUrl: string | null
  ready: boolean
  setTursoUrl: (url: string, token?: string) => Promise<void>
  clearTurso: () => Promise<void>
}

function createClientFromConfig(db: DbClient, url: string, token?: string | null): Client {
  return createTursoClient(url, token || undefined)
}

export function useDB(): DbState {
  const [db] = useState<DbClient>(() => {
    const path = process.env.TURSO_DB_PATH || "./data/tuido.db"
    const dir = path.split("/").slice(0, -1).join("/")
    if (dir) mkdirSync(dir, { recursive: true })
    return createLocalClient(path)
  })
  const [tursoClient, setTursoClient] = useState<Client | null>(null)
  const [tursoUrl, setTursoUrlState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initSchema(db).then(async () => {
      const [url, token] = await Promise.all([getTursoUrl(db), getTursoAuth(db)])
      if (url) {
        setTursoUrlState(url)
        setTursoClient(createClientFromConfig(db, url, token))
      }
      setReady(true)
    }).catch((e) => {
      console.error("Failed to init DB:", e)
      setReady(true)
    })
  }, [db])

  const setTursoUrlFn = useCallback(async (url: string, token?: string) => {
    await configureTurso(db, url, token)
    setTursoUrlState(url)
    setTursoClient(createClientFromConfig(db, url, token))
  }, [db])

  const clearTurso = useCallback(async () => {
    await setConfig(db, "turso_url", "")
    await setConfig(db, "turso_auth_token", "")
    setTursoUrlState(null)
    setTursoClient(null)
  }, [db])

  return { db, tursoClient, tursoUrl, ready, setTursoUrl: setTursoUrlFn, clearTurso }
}
