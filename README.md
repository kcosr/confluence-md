# confluence-md

Git-style CLI for bidirectional Confluence ↔ Markdown sync.

> ⚠️ **Lossy conversion warning:** This tool intentionally trades fidelity for simplicity. It’s best for:
> 1) Publishing simple Markdown docs to Confluence.
> 2) Exporting Confluence pages to Markdown for agent/LLM consumption.
>
> It is **not** well suited for round‑trip sync or editing complex Confluence pages that rely on rich macros or advanced formatting.

## Setup

```bash
npm install
```

## Credentials

Set credentials via environment variables (highest priority):

```bash
export CONFLUENCE_URL="https://company.atlassian.net"
export CONFLUENCE_EMAIL="user@company.com"
export CONFLUENCE_TOKEN="your-api-token"
```

Or use `~/.confluence-md/credentials`:

```json
{
  "profiles": {
    "default": {
      "url": "https://company.atlassian.net",
      "email": "user@company.com",
      "token": "your-api-token"
    }
  }
}
```

## CLI Usage

```bash
# Dev mode (defaults to fake server creds at http://localhost:3000)
npm run dev -- clone "https://company.atlassian.net/wiki/spaces/PROJ/pages/123456789/My+Page"

# Clone a page or space
confluence-md clone "https://company.atlassian.net/wiki/spaces/PROJ/pages/123456789/My+Page"

# Pull updates
confluence-md pull

# Push local changes
confluence-md push

# Diff local vs remote
confluence-md diff

# Diff summary only
confluence-md diff --stat

# Sync markdown from a source repo into a cloned workspace
confluence-md sync /path/to/docs

# Prefix synced pages under a root path (avoids wrapper directories)
confluence-md sync /path/to/docs --prefix agent-workspaces

# For a single-page clone, root README/index maps to the root page
confluence-md sync /path/to/docs

# View history
confluence-md log
```

## Repo → Confluence quick start

Use this flow when your **Git repo is the source of truth** and Confluence is a published view. You manage docs in Git and re-publish to Confluence as needed.

### Initial import under an empty root page
1) Create an **empty root page** in Confluence (UI) and copy its URL.
2) Clone that page (includes sub-pages if any):

```bash
confluence-md clone "<root page url>" ./workspace
cd ./workspace
```

3) Sync your repo into the workspace and push:

```bash
confluence-md sync /path/to/repo
confluence-md push --new --prune-attachments
```

### Subsequent updates (git is source of truth)

```bash
confluence-md sync /path/to/repo
confluence-md push --prune-attachments
```

If new files were added since last push, include `--new` once to create new pages.

### Pruning pages removed from git

```bash
confluence-md sync /path/to/repo --prune
confluence-md push --prune-pages --prune-attachments
```

Preview changes (including deletions) with:

```bash
confluence-md push --dry-run --prune-pages --prune-attachments
```

## Fake Confluence Server

```bash
npm run server
```

Use `--port` or `--data` to customize the server:

```bash
npm run server -- --port 8080 --data ./test-data
```

Create a test page and get a ready-to-use clone URL:

```bash
npm run seed:page -- --space TEST --title "My Page"
```

Optional flags:
- `--base-url` (defaults to `CONFLUENCE_URL` or `http://localhost:3000`)
- `--markdown` or `--markdown-file`
- `--email`/`--token` (defaults to `CONFLUENCE_EMAIL`/`CONFLUENCE_TOKEN`)
