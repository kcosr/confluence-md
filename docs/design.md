# Confluence-MD Design Document

## Background

Confluence is a widely-used wiki platform for team documentation. While it provides a web interface and API, there's no good way to:

1. Work on Confluence content offline using familiar tools (text editors, IDEs)
2. Version control Confluence content in Git alongside code
3. Batch edit multiple pages efficiently
4. Diff local changes against remote versions
5. Maintain a local backup of Confluence spaces

Confluence stores content in a proprietary XHTML-based "Storage Format" with custom namespaces and elements for macros, links, and attachments. This format is not human-readable or editable.

## Objectives

Build a Git-style CLI tool for bidirectional synchronization between Confluence Cloud and local Markdown files, with:

1. **Lossless round-trip conversion** - Content converted to Markdown and back to Confluence should preserve all information
2. **Git-like UX** - Familiar commands (`clone`, `pull`, `push`, `diff`, `log`, `status`) for users comfortable with Git
3. **Offline-first workflow** - Work locally, sync when ready
4. **Version history access** - Leverage Confluence's built-in versioning
5. **URL-based interface** - Use Confluence web URLs directly instead of requiring API IDs

## Goals

### Must Have (MVP)

- [ ] Clone a Confluence page or space to local Markdown
- [ ] Push local Markdown changes back to Confluence
- [ ] Pull remote changes to update local files
- [ ] Handle attachments (download and re-upload)
- [ ] Preserve non-Markdown Confluence elements via special syntax
- [ ] Diff local vs remote content
- [ ] View version history
- [ ] Conflict detection (warn if remote changed since last pull)
- [ ] Fake Confluence server for testing

### Should Have

- [ ] Clone/sync entire spaces with hierarchy
- [ ] Checkout specific historical versions
- [ ] Revert to previous versions
- [ ] Dry-run mode for push
- [ ] Status command showing sync state

### Nice to Have

- [ ] Three-way merge assistance
- [ ] Batch operations across multiple pages
- [ ] Watch mode for auto-sync
- [ ] Browser extension integration

---

## User Workflows

### Workflow 1: Clone and Edit Existing Page

```bash
# Clone a page using its web URL
confluence-md clone "https://company.atlassian.net/wiki/spaces/PROJ/pages/123456789/My+Page"

# Creates:
# my-page/
# ├── .confluence/
# │   └── config.json
# ├── page.md
# └── attachments/
#     └── diagram.png

cd my-page/
vim page.md          # Edit content
confluence-md diff   # See what changed vs remote
confluence-md push   # Upload changes
```

### Workflow 2: Create New Page Locally

```bash
mkdir new-feature-doc
cd new-feature-doc

confluence-md init
confluence-md remote set "https://company.atlassian.net/wiki/spaces/PROJ"

vim page.md          # Write content

# Push as new page under a parent
confluence-md push --new --parent "https://company.atlassian.net/wiki/spaces/PROJ/pages/123/Docs"
```

### Workflow 3: Clone Entire Space

```bash
confluence-md clone "https://company.atlassian.net/wiki/spaces/PROJ" ./proj-docs

# Creates:
# proj-docs/
# ├── .confluence/
# │   └── config.json
# ├── home/
# │   └── page.md
# ├── getting-started/
# │   ├── page.md
# │   └── attachments/
# └── api-reference/
#     └── page.md
```

### Workflow 4: View History and Diff Versions

```bash
cd my-page/

confluence-md log                    # View version history
confluence-md show 42                # View specific version
confluence-md diff 42 45             # Diff between two versions
confluence-md diff 42                # Diff local vs version 42
confluence-md checkout 42            # Download version 42 locally
confluence-md revert 42              # Restore version 42 (creates new version)
```

### Workflow 5: Handle Conflicts

```bash
cd my-page/
confluence-md push

# Output:
# Warning: Remote page has changed since last pull (version 42 → 45)
# Use --force to overwrite, or pull first to merge.

confluence-md diff           # See what changed remotely
confluence-md pull           # Update local (may need manual merge)
confluence-md push           # Push merged changes
```

---

## CLI Commands

### Initialization & Remote

| Command | Description |
|---------|-------------|
| `init [space-url]` | Initialize new confluence-md directory, optionally with remote |
| `remote` | Show current remote URL |
| `remote set <url>` | Set or change remote space/page URL |
| `remote remove` | Remove remote tracking |

### Sync Operations

| Command | Description |
|---------|-------------|
| `clone <url> [path]` | Download page/space to new local folder |
| `clone --no-attachments` | Clone without downloading attachments |
| `clone --no-labels` | Clone without syncing labels |
| `pull` | Refresh from tracked remote |
| `pull <url>` | Pull from different remote (override) |
| `pull --no-labels` | Pull without syncing labels |
| `push` | Push to tracked remote |
| `push --to <url>` | Push to different location |
| `push --new --parent <url>` | Create as new page under parent |
| `push --dry-run` | Preview changes without uploading |
| `push --minor` | Mark as minor edit (no notifications) |
| `push --message "..."` | Set version message |
| `push --no-labels` | Skip label sync |
| `push --force` | Overwrite even if remote changed |

### Comparison

| Command | Description |
|---------|-------------|
| `status` | Show sync status (modified, ahead, behind) |
| `diff` | Diff local vs current remote |
| `diff <url>` | Diff local vs different remote page |
| `diff <version>` | Diff local vs specific remote version |
| `diff <v1> <v2>` | Diff between two remote versions |
| `diff --cached` | Preview what would be pushed (storage format) |
| `diff --stat` | Show change summary only |

### History

| Command | Description |
|---------|-------------|
| `log` | Show version history |
| `log -n <count>` | Show last N versions |
| `log --all` | Show all versions |
| `log --author <email>` | Filter by author |
| `show <version>` | Display specific version content |
| `checkout <version>` | Download specific version locally |
| `revert <version>` | Restore old version (creates new version on Confluence) |

### Configuration

| Command | Description |
|---------|-------------|
| `config` | Show all config |
| `config <key>` | Show specific config value |
| `config <key> <value>` | Set config value |

### Global Options

| Option | Description |
|--------|-------------|
| `--help` | Show help |
| `--version` | Show version |
| `--json` | Output as JSON (for scripting) |
| `--no-color` | Disable colored output |
| `--verbose` | Verbose output |

---

## URL Parsing

Confluence Cloud URLs follow predictable patterns. The tool parses these to extract space key and page ID.

### URL Patterns

```
# Page URL
https://{instance}.atlassian.net/wiki/spaces/{spaceKey}/pages/{pageId}/{title}
https://{instance}.atlassian.net/wiki/spaces/{spaceKey}/pages/{pageId}

# Space URL
https://{instance}.atlassian.net/wiki/spaces/{spaceKey}/overview
https://{instance}.atlassian.net/wiki/spaces/{spaceKey}

# Blog post
https://{instance}.atlassian.net/wiki/spaces/{spaceKey}/blog/{year}/{month}/{day}/{pageId}/{title}

# Legacy format (redirects)
https://{instance}.atlassian.net/wiki/display/{spaceKey}/{title}
```

### URL Parser Module

```typescript
interface ParsedConfluenceUrl {
  instance: string;        // "company.atlassian.net"
  baseUrl: string;         // "https://company.atlassian.net"
  spaceKey: string;        // "PROJ"
  pageId?: string;         // "123456789"
  title?: string;          // "My Page"
  type: 'page' | 'space' | 'blog';
}

function parseConfluenceUrl(url: string): ParsedConfluenceUrl;
```

---

## Directory Structure

### Single Page

```
my-page/
├── .confluence/
│   └── config.json       # Tracking metadata
├── page.md               # Page content (pure Markdown)
└── attachments/          # Downloaded attachments
    ├── diagram.png
    └── report.pdf
```

### Space

```
proj-space/
├── .confluence/
│   └── config.json       # Space-level tracking, all pages
├── home/
│   ├── page.md
│   └── attachments/
├── getting-started/
│   ├── page.md
│   └── attachments/
│       └── screenshot.png
└── api-reference/
    ├── overview/
    │   └── page.md
    └── endpoints/
        └── page.md
```

### Labels File (Optional)

Each page directory can have a `labels.txt` file listing labels (one per line):

```
my-page/
├── page.md
├── labels.txt           # Optional: one label per line
└── attachments/
```

**labels.txt:**
```
documentation
api
getting-started
```

Labels are synced bidirectionally:
- On pull: labels from Confluence are written to `labels.txt`
- On push: labels in `labels.txt` are applied to the page
- Labels removed locally are removed from Confluence
- Use `--no-labels` flag to skip label sync

### Directory Naming

Page directories are derived from page titles:
- Lowercase
- Spaces → hyphens
- Remove special characters
- Handle duplicates with numeric suffix

```typescript
"My Page"           → "my-page"
"API Reference"     → "api-reference"
"FAQ & Help"        → "faq-help"
"My Page" (dup)     → "my-page-2"
```

---

## Configuration

### `.confluence/config.json`

```json
{
  "version": 1,
  "remote": "https://company.atlassian.net",
  "space": "PROJ",
  "type": "space",
  "settings": {
    "maxAttachmentSize": 52428800,
    "syncLabels": true
  },
  "pages": {
    "home": {
      "id": "123456789",
      "title": "Home",
      "parentId": null,
      "path": "home",
      "version": 42,
      "lastPulled": "2026-01-17T08:12:00Z",
      "lastPushed": "2026-01-17T09:00:00Z",
      "localBase": 42,
      "contentHash": "sha256:abc123def456...",
      "labels": ["documentation", "home"],
      "attachments": {
        "diagram.png": {
          "id": "att111222",
          "hash": "sha256:789xyz...",
          "size": 102400,
          "status": "synced"
        }
      }
    },
    "getting-started": {
      "id": "123456790",
      "title": "Getting Started",
      "parentId": "123456789",
      "path": "getting-started",
      "version": 18,
      "lastPulled": "2026-01-17T08:12:00Z",
      "localBase": 18,
      "contentHash": "sha256:...",
      "labels": ["tutorial", "getting-started"],
      "attachments": {}
    }
  }
}
```

### Field Definitions

| Field | Description |
|-------|-------------|
| `version` | Config schema version (for migrations) |
| `remote` | Confluence instance base URL |
| `space` | Space key |
| `type` | `"page"` or `"space"` |
| `settings.maxAttachmentSize` | Max attachment size in bytes (default 50MB) |
| `pages` | Map of local path → page metadata |
| `pages.*.id` | Confluence page ID (null if not yet pushed) |
| `pages.*.title` | Page title |
| `pages.*.parentId` | Parent page ID (null for space root) |
| `pages.*.path` | Local directory path relative to root |
| `pages.*.version` | Last known remote version number |
| `pages.*.lastPulled` | ISO timestamp of last pull |
| `pages.*.lastPushed` | ISO timestamp of last push |
| `pages.*.localBase` | Version number local content is based on |
| `pages.*.contentHash` | SHA256 hash of local page.md at last sync |
| `pages.*.labels` | Array of label names synced from Confluence |
| `pages.*.attachments` | Map of filename → attachment metadata |
| `settings.syncLabels` | Whether to sync labels (default: true) |

### Authentication

Authentication uses environment variables with config file fallback.

**Environment Variables (highest priority):**
```bash
export CONFLUENCE_URL="https://company.atlassian.net"
export CONFLUENCE_TOKEN="your-api-token"
export CONFLUENCE_EMAIL="user@company.com"  # Required for Basic auth
```

**Config File (`~/.confluence-md/credentials`):**
```json
{
  "profiles": {
    "default": {
      "url": "https://company.atlassian.net",
      "email": "user@company.com",
      "token": "your-api-token"
    },
    "work": {
      "url": "https://work.atlassian.net",
      "email": "user@work.com",
      "token": "work-api-token"
    }
  }
}
```

**Profile Selection:**
```bash
# Use specific profile
confluence-md clone --profile work "https://work.atlassian.net/..."

# Or via environment
export CONFLUENCE_PROFILE="work"
```

---

## Confluence Storage Format

Confluence uses XHTML with custom namespaces for macros and special elements.

### Namespaces

```xml
<ac:...>  <!-- Atlassian Confluence elements -->
<ri:...>  <!-- Resource Identifier elements -->
```

### Common Elements

#### Basic Content
```xml
<!-- Paragraphs, headings, lists - standard XHTML -->
<p>Paragraph text</p>
<h1>Heading</h1>
<ul><li>List item</li></ul>
<table>...</table>
```

#### Code Block
```xml
<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="language">python</ac:parameter>
  <ac:parameter ac:name="title">Example</ac:parameter>
  <ac:plain-text-body><![CDATA[print("hello")]]></ac:plain-text-body>
</ac:structured-macro>
```

#### Info/Warning/Note Panels
```xml
<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">Note</ac:parameter>
  <ac:rich-text-body>
    <p>This is an info panel.</p>
  </ac:rich-text-body>
</ac:structured-macro>
<!-- Also: warning, note, tip -->
```

#### Expand (Collapsible)
```xml
<ac:structured-macro ac:name="expand">
  <ac:parameter ac:name="title">Click to expand</ac:parameter>
  <ac:rich-text-body>
    <p>Hidden content here.</p>
  </ac:rich-text-body>
</ac:structured-macro>
```

#### Status Lozenge
```xml
<ac:structured-macro ac:name="status">
  <ac:parameter ac:name="colour">Green</ac:parameter>
  <ac:parameter ac:name="title">DONE</ac:parameter>
</ac:structured-macro>
```

#### Table of Contents
```xml
<ac:structured-macro ac:name="toc">
  <ac:parameter ac:name="maxLevel">3</ac:parameter>
</ac:structured-macro>
```

#### Internal Page Link
```xml
<ac:link>
  <ri:page ri:content-title="Page Title" ri:space-key="PROJ"/>
  <ac:plain-text-link-body><![CDATA[Link Text]]></ac:plain-text-link-body>
</ac:link>
```

#### Attachment/Image
```xml
<ac:image>
  <ri:attachment ri:filename="diagram.png"/>
</ac:image>

<!-- With attributes -->
<ac:image ac:width="500" ac:align="center">
  <ri:attachment ri:filename="diagram.png"/>
</ac:image>
```

#### User Mention
```xml
<ac:link>
  <ri:user ri:account-id="5a1234567890abcdef"/>
</ac:link>
```

#### Emoticon
```xml
<ac:emoticon ac:name="smile"/>
```

---

## Markdown Conversion

### Clean Mappings (Bidirectional)

| Confluence | Markdown |
|------------|----------|
| `<h1>` - `<h6>` | `#` - `######` |
| `<p>` | Paragraph |
| `<strong>` | `**bold**` |
| `<em>` | `*italic*` |
| `<code>` | `` `inline code` `` |
| `<ul>`, `<ol>` | `- ` / `1. ` lists |
| `<a href="...">` | `[text](url)` |
| `<table>` | GFM table |
| `<ac:structured-macro name="code">` | ` ``` ` fenced code block |
| `<ac:image><ri:attachment>` | `![alt](attachments/file.png)` |
| `<ac:task-list>` | `- [ ]` / `- [x]` task lists |

### Preserved via Special Syntax

Elements that don't map cleanly to Markdown are preserved using fenced code blocks with a `confluence` language identifier. This ensures lossless round-trip conversion.

#### Format

````markdown
```confluence:<macro-name>
key=value
key2=value2
---
Body content here (can contain Markdown)
```
````

The `---` separator is only present if the macro has body content.

#### Examples

**Status Lozenge:**
````markdown
```confluence:status
colour=Green
title=DONE
```
````

**Info Panel:**
````markdown
```confluence:info
title=Important Note
---
This content is inside an info panel.

It can contain **Markdown** formatting.
```
````

**Expand/Collapse:**
````markdown
```confluence:expand
title=Click to see more
---
This content is hidden by default.

- List items work
- Inside the expand
```
````

**Table of Contents:**
````markdown
```confluence:toc
maxLevel=3
```
````

**User Mention:**
````markdown
```confluence:mention
account-id=5a1234567890abcdef
display=John Smith
```
````

**Unknown/Complex Macros (Raw Preservation):**
````markdown
```confluence:raw
name=some-custom-macro
---
<ac:parameter ac:name="custom">value</ac:parameter>
<ac:rich-text-body><p>Raw storage format preserved</p></ac:rich-text-body>
```
````

### Internal Links

Links to other Confluence pages are converted to a special syntax:

```markdown
<!-- Link to page in same space -->
[Link Text](confluence://PROJ/Page+Title)

<!-- Link to page in different space -->
[Link Text](confluence://OTHER/Other+Page)

<!-- Link with page ID (more reliable) -->
[Link Text](confluence://PROJ/123456789)
```

On push, these are converted back to `<ac:link><ri:page>` elements.

### Attachments

Local attachments are referenced with relative paths:

```markdown
![Diagram](attachments/diagram.png)
[Download PDF](attachments/report.pdf)
```

### Failed/Skipped Attachments

If an attachment fails to download, a visible warning is inserted:

```markdown
> ⚠️ **ATTACHMENT NOT SYNCED:** `large-video.mp4`  
> Reason: File exceeded 50MB limit (actual: 150MB)  
> Original attachment ID: att123456
```

This renders visibly in both Markdown preview and (when pushed) in Confluence as an info panel.

---

## Confluence Cloud API

### Base URLs

```
REST API v1: https://{instance}.atlassian.net/wiki/rest/api/
REST API v2: https://{instance}.atlassian.net/wiki/api/v2/
```

### Authentication

```
Authorization: Basic base64(email:api-token)
```

### Key Endpoints

#### Pages

```
# Get page content
GET /rest/api/content/{id}?expand=body.storage,version,space,ancestors

# Get specific version of page (simpler than version endpoint)
GET /rest/api/content/{id}?expand=body.storage&version={number}

# Get page by space and title
GET /rest/api/content?spaceKey={key}&title={title}&expand=body.storage,version

# Search pages with CQL
GET /rest/api/content/search?cql=space=PROJ%20AND%20type=page&expand=body.storage,version

# Create page
POST /rest/api/content
{
  "type": "page",
  "title": "Page Title",
  "space": {"key": "PROJ"},
  "ancestors": [{"id": "parentId"}],
  "body": {
    "storage": {
      "value": "<p>Content</p>",
      "representation": "storage"
    }
  }
}

# Update page
# Note: conflictPolicy=abort (default) will fail if version mismatch
PUT /rest/api/content/{id}?conflictPolicy=abort
{
  "version": {
    "number": nextVersion,
    "minorEdit": false    // Set true to suppress notifications
  },
  "title": "Page Title",
  "type": "page",
  "body": {
    "storage": {
      "value": "<p>Updated content</p>",
      "representation": "storage"
    }
  }
}

# Delete page (moves to trash)
DELETE /rest/api/content/{id}

# Purge from trash
DELETE /rest/api/content/{id}?status=trashed
```

#### Versions

```
# Get history summary
GET /rest/api/content/{id}/history?expand=previousVersion,nextVersion,lastUpdated

# List all versions
GET /rest/api/content/{id}/version

# Get specific version content (alternative to ?version=N on content endpoint)
GET /rest/api/content/{id}/version/{versionNumber}?expand=body.storage
```

Version object structure:
```json
{
  "by": {
    "type": "known",
    "username": "jsmith",
    "displayName": "John Smith",
    "userKey": "..."
  },
  "when": "2026-01-17T08:00:00.000Z",
  "message": "Updated introduction",
  "number": 42,
  "minorEdit": false,
  "hidden": false
}
```

#### Spaces

```
# Get space
GET /rest/api/space/{key}?expand=homepage,description

# List all pages in space (flat)
GET /rest/api/space/{key}/content?type=page&expand=body.storage,version,ancestors&depth=all

# List root pages only
GET /rest/api/space/{key}/content?type=page&depth=root

# Alternative: search within space
GET /rest/api/content?spaceKey={key}&type=page&expand=body.storage,version&limit=100
```

#### Attachments

**Important:** Attachment uploads require XSRF protection header.

```
# List attachments
GET /rest/api/content/{id}/child/attachment
GET /rest/api/content/{id}/child/attachment?filename=diagram.png  # Filter by name

# Download attachment data
GET /rest/api/content/{id}/child/attachment/{attachmentId}/download

# Upload new attachment (multipart/form-data)
POST /rest/api/content/{id}/child/attachment
Headers:
  Content-Type: multipart/form-data
  X-Atlassian-Token: nocheck    # Required for XSRF protection
Form fields:
  file: (binary data)
  comment: "Optional comment"
  minorEdit: true/false

# Update attachment data (new version)
POST /rest/api/content/{id}/child/attachment/{attachmentId}/data
Headers:
  X-Atlassian-Token: nocheck
Form fields:
  file: (binary data)
  comment: "Updated diagram"
  minorEdit: true
```

#### Labels

Labels can be synced with pages for organization.

```
# Get labels on content
GET /rest/api/content/{id}/label

# Add labels
POST /rest/api/content/{id}/label
[
  {"prefix": "global", "name": "documentation"},
  {"prefix": "global", "name": "api"}
]

# Remove label
DELETE /rest/api/content/{id}/label/{labelName}
DELETE /rest/api/content/{id}/label?name={labelName}  # For labels with special chars
```

#### Content Body Conversion (Useful for Validation)

```
# Convert between representations
POST /rest/api/contentbody/convert/{to}
{
  "value": "<p>Storage format content</p>",
  "representation": "storage"
}

# Supported conversions:
# storage → view, export_view, styled_view, editor
# editor → storage
```

#### Children and Hierarchy

```
# Get child pages
GET /rest/api/content/{id}/child/page?expand=body.storage,version

# Get all descendants
GET /rest/api/content/{id}/descendant/page
```

### API Client Interface

```typescript
interface ConfluenceClient {
  // Pages
  getPage(pageId: string, options?: { version?: number }): Promise<Page>;
  getPageByTitle(spaceKey: string, title: string): Promise<Page | null>;
  searchPages(cql: string): Promise<Page[]>;
  createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<Page>;
  updatePage(pageId: string, title: string, content: string, version: number, options?: {
    minorEdit?: boolean;
    conflictPolicy?: 'abort' | 'update';
  }): Promise<Page>;
  deletePage(pageId: string): Promise<void>;
  
  // Spaces
  getSpace(spaceKey: string): Promise<Space>;
  getSpacePages(spaceKey: string, options?: { depth?: 'all' | 'root' }): Promise<Page[]>;
  
  // Versions
  getHistory(pageId: string): Promise<History>;
  getVersions(pageId: string): Promise<Version[]>;
  getPageAtVersion(pageId: string, versionNumber: number): Promise<Page>;
  
  // Attachments
  getAttachments(pageId: string): Promise<Attachment[]>;
  getAttachmentByFilename(pageId: string, filename: string): Promise<Attachment | null>;
  downloadAttachment(pageId: string, attachmentId: string): Promise<Buffer>;
  uploadAttachment(pageId: string, filename: string, data: Buffer, options?: {
    comment?: string;
    minorEdit?: boolean;
  }): Promise<Attachment>;
  updateAttachment(pageId: string, attachmentId: string, data: Buffer, options?: {
    comment?: string;
    minorEdit?: boolean;
  }): Promise<Attachment>;
  deleteAttachment(attachmentId: string): Promise<void>;
  
  // Labels
  getLabels(pageId: string): Promise<Label[]>;
  addLabels(pageId: string, labels: string[]): Promise<Label[]>;
  removeLabel(pageId: string, label: string): Promise<void>;
  
  // Hierarchy
  getChildPages(pageId: string): Promise<Page[]>;
  getDescendantPages(pageId: string): Promise<Page[]>;
  
  // Utilities
  convertBody(content: string, from: 'storage' | 'editor', to: 'view' | 'storage'): Promise<string>;
}

interface Page {
  id: string;
  type: 'page' | 'blogpost';
  status: 'current' | 'trashed' | 'draft';
  title: string;
  space: { key: string; name: string };
  version: Version;
  ancestors: { id: string; title: string }[];
  body: {
    storage: { value: string; representation: 'storage' };
  };
  _links: {
    webui: string;
    self: string;
  };
}

interface Version {
  number: number;
  by: {
    displayName: string;
    email?: string;
    userKey: string;
  };
  when: string; // ISO timestamp
  message: string;
  minorEdit: boolean;
}

interface Attachment {
  id: string;
  title: string; // filename
  metadata: {
    mediaType: string;
    comment?: string;
  };
  version: Version;
  _links: {
    download: string;
  };
}

interface Label {
  prefix: 'global' | 'personal';
  name: string;
  id: string;
}
```

---

## Fake Confluence Server

A local server implementing the Confluence API for testing and offline development.

### Features

- Implements all required API endpoints
- File-based JSON storage (persists between restarts)
- Basic auth validation (accepts any token)
- Versioning support (tracks all page versions)
- Attachment storage

### Storage Structure

```
server-data/
├── spaces/
│   └── PROJ.json           # Space metadata
├── pages/
│   ├── 123456789.json      # Page metadata + current content
│   └── 123456789.versions/ # Version history
│       ├── 1.json
│       ├── 2.json
│       └── 3.json
└── attachments/
    └── 123456789/          # Attachments by page ID
        ├── att111.meta.json
        └── att111.data      # Binary data
```

### Running

```bash
# Start server on default port 3000
npm run server

# Start on custom port
npm run server -- --port 8080

# Start with specific data directory
npm run server -- --data ./test-data
```

### Authentication & XSRF

The fake server should:
- Accept any `Authorization: Basic ...` header (validate format, not credentials)
- Require `X-Atlassian-Token: nocheck` for attachment uploads (return 403 without it)
- Return realistic error responses matching Confluence's format

### Testing Integration

```typescript
// In tests, server starts automatically
import { startTestServer, stopTestServer } from './server';

beforeAll(async () => {
  await startTestServer({ port: 0 }); // Random port
});

afterAll(async () => {
  await stopTestServer();
});
```

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/api/content/:id` | Get page |
| GET | `/rest/api/content` | Search/list pages |
| POST | `/rest/api/content` | Create page |
| PUT | `/rest/api/content/:id` | Update page |
| DELETE | `/rest/api/content/:id` | Delete page |
| GET | `/rest/api/content/:id/history` | Get history |
| GET | `/rest/api/content/:id/version` | List versions |
| GET | `/rest/api/content/:id/version/:num` | Get version |
| GET | `/rest/api/space/:key` | Get space |
| GET | `/rest/api/space/:key/content` | Get space content |
| GET | `/rest/api/content/:id/child/page` | Get child pages |
| GET | `/rest/api/content/:id/child/attachment` | List attachments |
| GET | `/rest/api/content/:id/child/attachment/:attId/download` | Download |
| POST | `/rest/api/content/:id/child/attachment` | Upload |
| GET | `/rest/api/content/:id/label` | Get labels |
| POST | `/rest/api/content/:id/label` | Add labels |
| DELETE | `/rest/api/content/:id/label/:name` | Remove label |
| POST | `/rest/api/contentbody/convert/:to` | Convert body format |

---

## Project Structure

```
confluence-md/
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── README.md
├── DESIGN.md                 # This document
│
├── src/
│   ├── index.ts              # Main entry (exports library)
│   ├── cli.ts                # CLI entry point
│   │
│   ├── cli/                  # CLI command implementations
│   │   ├── index.ts          # Commander setup
│   │   ├── clone.ts
│   │   ├── pull.ts
│   │   ├── push.ts
│   │   ├── diff.ts
│   │   ├── log.ts
│   │   ├── status.ts
│   │   ├── init.ts
│   │   ├── remote.ts
│   │   ├── show.ts
│   │   ├── checkout.ts
│   │   ├── revert.ts
│   │   └── config.ts
│   │
│   ├── api/                  # Confluence API client
│   │   ├── client.ts         # Main client class
│   │   ├── pages.ts          # Page operations
│   │   ├── spaces.ts         # Space operations
│   │   ├── versions.ts       # Version operations
│   │   ├── attachments.ts    # Attachment operations
│   │   └── types.ts          # API response types
│   │
│   ├── converter/            # Format conversion
│   │   ├── storage-to-md.ts  # Confluence → Markdown
│   │   ├── md-to-storage.ts  # Markdown → Confluence
│   │   ├── elements.ts       # Element-specific converters
│   │   └── confluence-blocks.ts # Parse/serialize confluence: blocks
│   │
│   ├── parser/               # Parsing utilities
│   │   ├── url-parser.ts     # Parse Confluence URLs
│   │   ├── storage-parser.ts # Parse Confluence XML
│   │   └── md-parser.ts      # Parse Markdown + confluence blocks
│   │
│   ├── sync/                 # Sync logic
│   │   ├── config.ts         # Read/write .confluence/config.json
│   │   ├── tracker.ts        # Track sync state, detect changes
│   │   ├── conflict.ts       # Conflict detection
│   │   └── attachments.ts    # Attachment sync logic
│   │
│   ├── auth/                 # Authentication
│   │   ├── credentials.ts    # Load credentials (env + file)
│   │   └── profiles.ts       # Profile management
│   │
│   ├── utils/                # Utilities
│   │   ├── hash.ts           # Content hashing
│   │   ├── paths.ts          # Path manipulation
│   │   ├── slug.ts           # Title → directory name
│   │   └── diff.ts           # Diff generation
│   │
│   └── types.ts              # Shared types
│
├── server/                   # Fake Confluence server
│   ├── index.ts              # Server entry point
│   ├── app.ts                # Express app setup
│   ├── routes/
│   │   ├── content.ts        # /wiki/rest/api/content
│   │   ├── space.ts          # /wiki/rest/api/space
│   │   └── attachment.ts     # Attachment endpoints
│   ├── store/
│   │   ├── index.ts          # Store interface
│   │   ├── file-store.ts     # File-based JSON storage
│   │   └── types.ts          # Store types
│   └── middleware/
│       └── auth.ts           # Basic auth middleware
│
└── test/
    ├── setup.ts              # Test setup (server lifecycle)
    ├── fixtures/             # Test data
    │   ├── pages/            # Sample Confluence pages
    │   └── markdown/         # Sample Markdown files
    ├── unit/
    │   ├── converter/
    │   ├── parser/
    │   └── sync/
    └── integration/
        ├── clone.test.ts
        ├── pull.test.ts
        ├── push.test.ts
        └── diff.test.ts
```

---

## Dependencies

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `chalk` | Terminal colors |
| `unified` | Markdown processing pipeline |
| `remark-parse` | Markdown parser |
| `remark-stringify` | Markdown serializer |
| `remark-gfm` | GitHub Flavored Markdown support |
| `rehype-parse` | HTML parser |
| `rehype-stringify` | HTML serializer |
| `fast-xml-parser` | Parse Confluence storage XML |
| `diff` | Generate text diffs |
| `glob` | File pattern matching |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler |
| `@biomejs/biome` | Linting and formatting |
| `vitest` | Testing framework |
| `express` | Fake server (also used in tests) |
| `@types/express` | Express type definitions |
| `@types/node` | Node.js type definitions |
| `tsx` | TypeScript execution for dev |

---

## Implementation Order

### Phase 1: Foundation

1. Project setup (package.json, tsconfig, biome, vitest)
2. Type definitions
3. URL parser
4. Confluence API client (basic: get page, get space)
5. Fake server (basic: serve page, list pages)

### Phase 2: Core Conversion

6. Storage format parser (XML → AST)
7. Markdown generator (AST → Markdown)
8. Confluence block syntax (preserve macros)
9. Markdown parser (Markdown → AST)
10. Storage format generator (AST → XML)

### Phase 3: CLI - Basic Commands

11. Config management (.confluence/config.json)
12. `clone` command (page only first)
13. `pull` command
14. `push` command
15. Authentication handling

### Phase 4: Attachments

16. Attachment download in clone/pull
17. Attachment upload in push
18. Attachment reference conversion (paths ↔ ri:attachment)

### Phase 5: Diff & Status

19. `status` command
20. `diff` command (local vs remote)
21. `diff` between versions

### Phase 6: History

22. `log` command
23. `show` command
24. `checkout` command
25. `revert` command

### Phase 7: Advanced

26. Space cloning (full hierarchy)
27. `init` and `remote` commands
28. Conflict detection and warnings
29. `--dry-run` mode
30. Profile support

---

## Testing Strategy

### Unit Tests

- URL parser: various URL formats
- Converter: element-by-element conversion both directions
- Config: read/write/merge operations
- Hash: deterministic hashing

### Integration Tests

Against fake server:
- Clone page → verify local structure
- Clone → edit → push → verify remote
- Clone → remote edit → pull → verify local
- Clone → local edit → remote edit → detect conflict
- Attachment round-trip

### Test Fixtures

Pre-built Confluence pages covering:
- Basic content (headings, paragraphs, lists, tables)
- Code blocks with various languages
- All macro types (info, warning, expand, status, toc)
- Internal links
- Attachments
- Complex nested structures

---

## Error Handling

### Error Types

```typescript
class ConfluenceMdError extends Error {
  code: string;
}

class AuthenticationError extends ConfluenceMdError {
  code = 'AUTH_ERROR';
}

class NotFoundError extends ConfluenceMdError {
  code = 'NOT_FOUND';
}

class ConflictError extends ConfluenceMdError {
  code = 'CONFLICT';
  localVersion: number;
  remoteVersion: number;
}

class NotConfluenceMdDirectoryError extends ConfluenceMdError {
  code = 'NOT_CONFLUENCE_MD_DIR';
}
```

### User-Friendly Messages

```
Error: Not a confluence-md directory (no .confluence/config.json found)
  Run 'confluence-md init' to initialize, or 'confluence-md clone <url>' to download.

Error: Authentication failed
  Check your CONFLUENCE_TOKEN environment variable or ~/.confluence-md/credentials

Error: Remote page has changed (version 42 → 45)
  Run 'confluence-md pull' to update, or 'confluence-md push --force' to overwrite.

Error: Page not found: https://company.atlassian.net/wiki/spaces/PROJ/pages/999
  The page may have been deleted or you may not have access.
```

---

## API Implementation Notes

### Important Headers

```typescript
// Standard headers for all requests
const headers = {
  'Authorization': `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Additional header required for attachment uploads (XSRF protection)
const attachmentHeaders = {
  ...headers,
  'X-Atlassian-Token': 'nocheck',
  'Content-Type': 'multipart/form-data', // Let library set boundary
};
```

### Expand Parameter

The `expand` parameter is crucial for getting nested data in a single request:

```typescript
// Common expand combinations
const EXPAND_PAGE_FULL = 'body.storage,version,space,ancestors,history';
const EXPAND_PAGE_MINIMAL = 'version,space';
const EXPAND_VERSION = 'body.storage';
const EXPAND_SPACE = 'homepage,description';
```

### Pagination

All list endpoints use `start` and `limit`:

```typescript
async function* getAllPages(spaceKey: string): AsyncGenerator<Page> {
  let start = 0;
  const limit = 100; // Max typically 100-200
  
  while (true) {
    const response = await client.get(`/rest/api/space/${spaceKey}/content`, {
      params: { type: 'page', start, limit, expand: EXPAND_PAGE_MINIMAL }
    });
    
    for (const page of response.results) {
      yield page;
    }
    
    if (response.results.length < limit) break;
    start += limit;
  }
}
```

### Version Conflict Handling

```typescript
// Update with conflict detection
async function updatePage(pageId: string, content: string, expectedVersion: number) {
  try {
    await client.put(`/rest/api/content/${pageId}?conflictPolicy=abort`, {
      version: { number: expectedVersion + 1 },
      // ...
    });
  } catch (error) {
    if (error.response?.status === 409) {
      throw new ConflictError('Remote page has changed');
    }
    throw error;
  }
}
```

### Rate Limiting

Confluence Cloud has rate limits. Implement exponential backoff:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '5');
        await sleep(retryAfter * 1000 * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Future Considerations

### Not in Scope (Yet)

- Real-time sync / watch mode
- Confluence Data Center / Server support (different API)
- GUI application
- Browser extension
- Merge conflict resolution UI
- Team collaboration features
- Comments sync (inline and footer comments)
- Content properties (key/value metadata store on pages)
- Space deletion (requires long-task polling)

### API Deprecation

Confluence API v1 is being phased out in favor of v2. Design the API client to:
- Prefer v2 endpoints where available
- Fall back to v1 where necessary
- Abstract the version difference from the rest of the codebase

---

## References

- [Confluence Cloud REST API](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/)
- [Confluence Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)
- [Atlassian API Tokens](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
