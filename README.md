# confluence-md

Git-style CLI for bidirectional Confluence ↔ Markdown sync.

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

# View history
confluence-md log
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
