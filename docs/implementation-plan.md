# Implementation Plan

## Goals
- Deliver the MVP for `confluence-md` as defined in `docs/design.md`.
- Implement Confluence REST API **v1** only for MVP with a client abstraction to enable future v2 migration.
- Preserve content round‑trip fidelity (storage ↔ Markdown), including macros and attachments.

## Guiding Decisions (from design)
- API v1 only for MVP; client abstraction enables future v2.
- Internal links prefer pageId when known; title-based links accepted as fallback.
- Auto-rename/move local directories on pull when titles/parents change.
- Remote attachments are only deleted with `--prune-attachments`.
- `push --force` fetches latest remote version and overwrites with version+1.
- Skipped attachments are recorded in config; warnings are written to Markdown only with `--write-attachment-warnings`.

---

## Phase 1 — Project Scaffolding & Core Types
**Deliverables**
- TypeScript tooling: `tsconfig.json`, `biome.json`, `vitest.config.ts`.
- Source layout: `src/` + initial entry points.
- Shared error classes and core types.

**Tasks**
1. Create `tsconfig.json` with ESM output to `dist/`, NodeNext module resolution, and strict settings.
2. Add `biome.json` with formatting/lint defaults for TS/TSX.
3. Add `vitest.config.ts` for unit + integration test locations.
4. Create `src/index.ts` (exports library API) and `src/cli.ts` (CLI entry).
5. Define shared types in `src/types.ts` and error classes in `src/errors.ts`.

**Tests**
- None yet (smoke compile once code exists).

---

## Phase 2 — Utilities + URL Parsing
**Deliverables**
- Utilities for hashing, slug generation, path helpers.
- URL parser with comprehensive unit tests.

**Tasks**
1. Implement `utils/hash.ts` (sha256).
2. Implement `utils/slug.ts` (title → directory slug).
3. Implement `utils/paths.ts` (workspace paths, path normalization).
4. Implement `parser/url-parser.ts` and unit tests (legacy + page + space + blog URLs).

**Tests**
- Unit tests for URL parser and slugging.

---

## Phase 3 — Config & Tracking
**Deliverables**
- `.confluence/config.json` read/write module with new indexing scheme.
- Tracking helpers for local/remote version state.

**Tasks**
1. Implement config read/write + validation in `sync/config.ts`.
2. Support `pages` keyed by page key (page ID or `local:<uuid>`) and `paths` index.
3. Track content hash, localBase, lastPulled/lastPushed.
4. Implement rename/move handling on pull to update filesystem + `paths` map.

**Tests**
- Unit tests for config migration + path index updates.

---

## Phase 4 — Confluence API Client (v1)
**Deliverables**
- REST v1 client with pagination, retry/backoff, and normalized response types.

**Tasks**
1. Build `api/client.ts` with auth, retries, error normalization.
2. Implement `api/pages.ts`, `api/spaces.ts`, `api/versions.ts`, `api/attachments.ts`, `api/labels.ts`.
3. Add type definitions in `api/types.ts`.
4. Ensure all endpoints use v1 base URLs.

**Tests**
- Unit tests using mocked HTTP responses.

---

## Phase 5 — Conversion Pipeline
**Deliverables**
- Storage XML ↔ Markdown round‑trip converters.
- Confluence macro block parser with JSON‑quoted param values.

**Tasks**
1. Implement storage XML parser to AST (`parser/storage-parser.ts`).
2. Implement Markdown parser (`parser/md-parser.ts`) with macro blocks.
3. Implement storage→md (`converter/storage-to-md.ts`) and md→storage (`converter/md-to-storage.ts`).
4. Handle internal links: prefer pageId when known.
5. Implement macro block serialization with JSON‑quoted values.

**Tests**
- Unit tests for element‑level conversions and macro block round‑trips.

---

## Phase 6 — Sync Engine
**Deliverables**
- Sync operations (clone, pull, push) orchestrated in `sync/`.

**Tasks**
1. Implement `sync/tracker.ts` + `sync/conflict.ts`.
2. Implement `clone`, `pull`, `push` core flows (not CLI wiring yet).
3. Add `--force` handling (fetch latest version, overwrite with version+1).
4. Implement `--dry-run` logic for push.

**Tests**
- Integration tests against fake server for clone/pull/push basics.

---

## Phase 7 — Attachments & Labels
**Deliverables**
- Attachment + label sync with skip tracking and optional warning insertion.

**Tasks**
1. Implement attachment download/upload/update in `sync/attachments.ts`.
2. Track skipped attachments in config with reason.
3. Implement `--write-attachment-warnings` for clone/pull.
4. Implement `--prune-attachments` for push deletions.
5. Implement labels sync and `--no-labels` flag.

**Tests**
- Integration tests for attachment round‑trip + skipped attachment handling.

---

## Phase 8 — CLI Commands
**Deliverables**
- CLI command implementations (clone/pull/push/diff/log/status/etc.).

**Tasks**
1. Implement `src/cli/index.ts` with Commander wiring.
2. Implement commands in `src/cli/*`.
3. Add JSON output and consistent error rendering.

**Tests**
- CLI integration tests for core flows.

---

## Phase 9 — Diff, History, Status
**Deliverables**
- Diff and history commands working across local and remote versions.

**Tasks**
1. Implement `utils/diff.ts` and integrate `diff` command.
2. Ensure `diff --cached` uses storage-format comparison.
3. Implement `log`, `show`, `checkout`, `revert`, `status`.

**Tests**
- Integration tests for history/diff flows.

---

## Phase 10 — Fake Confluence Server
**Deliverables**
- Test server with file‑based storage per design.

**Tasks**
1. Create server app, routes, and store layers.
2. Implement endpoints listed in `docs/design.md`.
3. Add test harness utilities to start/stop server.

**Tests**
- Integration tests for fake server endpoints.

---

## Phase 11 — Documentation & Polish
**Deliverables**
- Updated README + examples.

**Tasks**
1. Update README with usage examples and flags.
2. Ensure design doc stays aligned with any implementation adjustments.

---

## Post-MVP Enhancements (Implemented)
- Page subtree cloning when cloning a single page (includes descendants).
- `sync` command to stage repo markdown into a workspace with link and attachment rewriting.
- `sync --prefix` to stage content under a root path without wrapper directories.
- Page-context sync: root README/index maps to the root page when cloning a single page.
- `sync --prune` to mark missing pages for deletion.
- `push --prune-pages` to delete remote pages marked for deletion.
- `push --dry-run` plan output for created/updated/deleted pages and attachments.
- Integration tests against the fake server.

## Execution Order
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7
8. Phase 8
9. Phase 9
10. Phase 10
11. Phase 11
