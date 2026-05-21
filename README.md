# tuido

A terminal-based todo list manager built with OpenTUI. Manage multiple todo lists, search, sort, and optionally sync with a Turso database.

## Install

### Prerequisites

- [Bun](https://bun.sh/) 1.0+

### Via git

```bash
git clone <repo-url> tuido
cd tuido
bun install
bun link      # makes `tuido` available globally
```

Then run from any terminal:

```bash
tuido
```

### Run without linking

```bash
bun run src/index.tsx
```

### Dev mode (auto-restart on changes)

```bash
bun run dev
```

## Usage

### Controls

| Key | Action |
|-----|--------|
| `Tab` | Switch focus between Lists / Todos panels |
| `↑` `↓` or `j` `k` | Navigate items |
| `Enter` | Select a list / toggle a todo |
| `Space` | Toggle todo check/uncheck |
| `n` | Create new list (focus on Lists) or new todo (focus on Todos) |
| `d` | Delete current item |
| `r` | Rename selected list |
| `/` | Search |
| `o` | Cycle sort: by modified → created → name |
| `s` | Sync with Turso (if configured) |
| `c` | Configure Turso sync (URL + optional auth token) |
| `s` | Sync with Turso (if configured) |
| `?` | Show help |
| `q` / `Esc` | Quit |

### Data

Local data is stored in `./data/tuido.db` (SQLite). The directory is created automatically on first run.

## Sync with Turso

### 1. Create a Turso database

```bash
turso db create my-tuido
turso db show my-tuido --url              # get the connection URL
turso db tokens create my-tuido            # get an auth token
```

### 2. Configure

**From the TUI (URL only):** Press `c`, enter your database URL. If you skip the token, set `TURSO_AUTH_TOKEN` as an env var.

**From the CLI (URL + token):**
```bash
tuido config libsql://my-tuido-owner.region.turso.io --token eyJhbGciOiJ...
```

**Via environment variables (fallback):**
```bash
TURSO_URL=libsql://my-tuido-owner.region.turso.io \
TURSO_AUTH_TOKEN=eyJhbGciOiJ... \
tuido
```

### 3. Sync

Press `s` in the TUI. The sync:
- Pulls remote changes since last sync
- Reconciles with local changes (last-write-wins by `updated_at` timestamp)
- Pushes local changes to the remote

### Manage config

```bash
tuido config              # show current config
tuido config <url> --token <token>  # set URL and token
tuido config --clear      # clear config
```

## Project Structure

```
src/
  index.tsx          Entry point / CLI dispatcher
  cli-config.ts      `tuido config` command
  app.tsx            Main app and keyboard routing
  components/        UI components
  hooks/             State management hooks
  db/                Database layer (local SQLite + Turso sync)
  utils/             Types and utilities
```
