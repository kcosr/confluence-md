import { promises as fs } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { glob } from "glob";
import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { ConfluenceMdConfig, PageMetadata } from "../types.js";
import { attachmentsDirPath, normalizePath, pageDirFromPath } from "../utils/paths.js";
import { slugify } from "../utils/slug.js";
import { createLocalPageKey, readConfig, writeConfig } from "./config.js";
import { writePageMarkdown } from "./tracker.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const INDEX_FILES = new Set(["readme", "index"]);

export interface SyncFromSourceOptions {
  prefix?: string;
  prune?: boolean;
}

export interface SyncFromSourceResult {
  updatedPages: number;
  createdPages: number;
  attachmentsCopied: number;
}

export async function syncFromSource(
  workspaceDir: string,
  sourcePath: string,
  options: SyncFromSourceOptions = {},
): Promise<SyncFromSourceResult> {
  const config = await readConfig(workspaceDir);
  if (!config.space) {
    throw new Error("Sync requires a configured space key");
  }
  const sourceRoot = resolve(sourcePath);
  const markdownFiles = await findMarkdownFiles(sourceRoot);
  const prefix = normalizePrefix(options.prefix);
  const mapRootToWorkspace = config.type === "page" && !prefix;

  const fileInfos = await Promise.all(
    markdownFiles.map(async (filePath) =>
      buildFileInfo(filePath, sourceRoot, prefix, mapRootToWorkspace),
    ),
  );

  const pagePaths = new Set<string>();
  const pagePathBySource = new Map<string, string>();
  const titlesByPath = new Map<string, string>();

  for (const info of fileInfos) {
    pagePaths.add(info.pagePath);
    pagePathBySource.set(info.filePath, info.pagePath);
    titlesByPath.set(info.pagePath, info.title);

    for (const parentPath of collectParentPaths(info.pagePath)) {
      pagePaths.add(parentPath);
    }
  }

  const sortedPaths = Array.from(pagePaths).sort((a, b) => depthForPath(a) - depthForPath(b));
  let createdPages = 0;

  for (const path of sortedPaths) {
    const existingKey = config.paths[path];
    if (!existingKey) {
      const pageKey = createLocalPageKey();
      const title = titlesByPath.get(path) ?? titleFromPath(path);
      const metadata: PageMetadata = {
        id: null,
        title,
        parentId: null,
        path,
        version: 0,
        labels: [],
        attachments: {},
        deleted: false,
      };
      config.pages[pageKey] = metadata;
      config.paths[path] = pageKey;
      createdPages += 1;
    } else {
      const metadata = config.pages[existingKey];
      if (metadata) {
        metadata.deleted = false;
        if (!metadata.id) {
          const title = titlesByPath.get(path);
          if (title) {
            metadata.title = title;
          }
        }
      }
    }
  }

  for (const metadata of Object.values(config.pages)) {
    if (!metadata.id) {
      metadata.parentId = resolveParentId(metadata.path, config);
    }
  }

  if (options.prune) {
    const pagePathSet = new Set(pagePaths);
    for (const metadata of Object.values(config.pages)) {
      if (metadata.path === ".") {
        continue;
      }
      if (!pagePathSet.has(metadata.path)) {
        metadata.deleted = true;
        await removeLocalPageDir(workspaceDir, metadata.path);
      }
    }
  }

  let updatedPages = 0;
  let attachmentsCopied = 0;

  for (const info of fileInfos) {
    const pageKey = config.paths[info.pagePath];
    if (!pageKey) {
      continue;
    }
    const metadata = config.pages[pageKey];
    if (!metadata) {
      continue;
    }

    const pageDir = pageDirFromPath(workspaceDir, info.pagePath);
    await fs.mkdir(pageDir, { recursive: true });

    const attachmentsDir = attachmentsDirPath(pageDir);
    const attachmentContext: AttachmentContext = {
      sourceRoot,
      sourceFile: info.filePath,
      attachmentsDir,
      nameBySource: new Map(),
      usedNames: new Set(),
    };

    const rewritten = await rewriteMarkdownLinks(
      info.markdown,
      config,
      pagePathBySource,
      attachmentContext,
    );

    attachmentsCopied += rewritten.attachmentsCopied;

    await writePageMarkdown(pageDir, rewritten.content);
    updatedPages += 1;

    if (!metadata.id) {
      metadata.title = info.title;
    }
  }

  for (const path of sortedPaths) {
    if (titlesByPath.has(path)) {
      continue;
    }
    const pageKey = config.paths[path];
    if (!pageKey) {
      continue;
    }
    const metadata = config.pages[pageKey];
    if (!metadata) {
      continue;
    }
    const pageDir = pageDirFromPath(workspaceDir, path);
    await fs.mkdir(pageDir, { recursive: true });
    const pageMdPath = join(pageDir, "page.md");
    const exists = await fileExists(pageMdPath);
    if (!exists) {
      await writePageMarkdown(pageDir, `# ${metadata.title}\n`);
    }
  }

  await writeConfig(workspaceDir, config);

  return { updatedPages, createdPages, attachmentsCopied };
}

interface FileInfo {
  filePath: string;
  pagePath: string;
  title: string;
  markdown: string;
}

async function buildFileInfo(
  filePath: string,
  sourceRoot: string,
  prefix: string,
  mapRootToWorkspace: boolean,
): Promise<FileInfo> {
  const markdown = await fs.readFile(filePath, "utf8");
  const relativePath = normalizePath(relative(sourceRoot, filePath));
  const pagePath = derivePagePath(relativePath);
  const title = extractTitle(markdown, relativePath);
  const finalPagePath = applyPrefix(pagePath, relativePath, prefix, mapRootToWorkspace);

  return { filePath, pagePath: finalPagePath, title, markdown };
}

async function findMarkdownFiles(sourceRoot: string): Promise<string[]> {
  const matches = await glob(["**/*.md", "**/*.markdown"], {
    cwd: sourceRoot,
    nodir: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/.confluence/**"],
  });

  return matches.map((filePath) => resolve(filePath));
}

function derivePagePath(relativeFilePath: string): string {
  const normalized = relativeFilePath.split(sep).join("/");
  const parsed = normalizePath(normalized);
  const ext = extname(parsed);
  const pathWithoutExt = ext ? parsed.slice(0, -ext.length) : parsed;
  const parts = pathWithoutExt.split("/");
  const fileName = parts.pop() ?? "";
  const baseName = fileName.toLowerCase();
  const segments = parts.map((segment) => slugify(segment));

  if (INDEX_FILES.has(baseName) && segments.length > 0) {
    return normalizePath(segments.join("/"));
  }

  const tail = baseName ? slugify(fileName) : "";
  return normalizePath([...segments, tail].filter(Boolean).join("/"));
}

function extractTitle(markdown: string, fallbackPath: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }

  const fallbackName = fallbackPath.split("/").pop() ?? "page";
  return titleFromName(fallbackName);
}

function titleFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const name = parts.length > 0 ? parts[parts.length - 1] : "page";
  return titleFromName(name);
}

function titleFromName(name: string): string {
  const cleaned = name.replace(/[-_]/g, " ").trim();
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function collectParentPaths(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  const parents: string[] = [];
  for (let i = 1; i < segments.length; i += 1) {
    parents.push(segments.slice(0, i).join("/"));
  }
  return parents;
}

function normalizePrefix(prefix?: string): string {
  if (!prefix) {
    return "";
  }
  const normalized = normalizePath(prefix);
  if (!normalized || normalized === ".") {
    return "";
  }
  return normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => slugify(segment))
    .join("/");
}

function applyPrefix(
  pagePath: string,
  relativePath: string,
  prefix: string,
  mapRootToWorkspace: boolean,
): string {
  const baseName = basename(relativePath, extname(relativePath)).toLowerCase();
  const isRootIndex = INDEX_FILES.has(baseName) && !relativePath.includes("/");

  if (mapRootToWorkspace && isRootIndex) {
    return ".";
  }

  if (prefix && isRootIndex) {
    return normalizePath(prefix);
  }

  if (!prefix) {
    return pagePath;
  }

  return normalizePath([prefix, pagePath].filter(Boolean).join("/"));
}

function depthForPath(path: string): number {
  return path.split("/").filter(Boolean).length;
}

function resolveParentId(path: string, config: ConfluenceMdConfig): string | null {
  const parentPath = normalizePath(dirname(path));
  if (!parentPath || parentPath === ".") {
    return config.type === "page" ? getRootPageId(config) : null;
  }

  const parentKey = config.paths[parentPath];
  if (!parentKey) {
    return config.type === "page" ? getRootPageId(config) : null;
  }

  const parent = config.pages[parentKey];
  return parent?.id ?? null;
}

function getRootPageId(config: ConfluenceMdConfig): string | null {
  const rootKey = config.paths["."];
  if (!rootKey) {
    return null;
  }
  const root = config.pages[rootKey];
  return root?.id ?? null;
}

interface AttachmentContext {
  sourceRoot: string;
  sourceFile: string;
  attachmentsDir: string;
  usedNames: Set<string>;
  nameBySource: Map<string, string>;
}

interface RewriteResult {
  content: string;
  attachmentsCopied: number;
}

type MdastNode = {
  type: string;
  url?: string;
  children?: MdastNode[];
};

async function rewriteMarkdownLinks(
  markdown: string,
  config: ConfluenceMdConfig,
  pagePathBySource: Map<string, string>,
  attachmentContext: AttachmentContext,
): Promise<RewriteResult> {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;

  const updateNode = async (node: MdastNode): Promise<void> => {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.type === "link" || node.type === "image") {
      const url = typeof node.url === "string" ? node.url : "";
      const updated = await rewriteLinkUrl(url, config, pagePathBySource, attachmentContext);
      node.url = updated;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        await updateNode(child);
      }
    }
  };

  await updateNode(tree as unknown as MdastNode);

  const content = unified().use(remarkStringify).use(remarkGfm).stringify(tree);
  return { content, attachmentsCopied: attachmentContext.usedNames.size };
}

async function rewriteLinkUrl(
  url: string,
  config: ConfluenceMdConfig,
  pagePathBySource: Map<string, string>,
  context: AttachmentContext,
): Promise<string> {
  if (!url || isExternalUrl(url) || url.startsWith("#")) {
    return url;
  }

  if (url.startsWith("confluence://")) {
    return url;
  }

  const { pathPart, anchor } = splitUrl(url);
  const resolved = resolve(dirname(context.sourceFile), pathPart);
  const extension = extname(resolved).toLowerCase();

  if (MARKDOWN_EXTENSIONS.has(extension)) {
    const targetPagePath = pagePathBySource.get(resolved);
    if (!targetPagePath) {
      return url;
    }
    const pageKey = config.paths[targetPagePath];
    const metadata = pageKey ? config.pages[pageKey] : undefined;
    const target = metadata?.id ?? encodeTitle(metadata?.title ?? targetPagePath);
    const link = `confluence://${config.space}/${target}`;
    return anchor ? `${link}#${anchor}` : link;
  }

  if (!(await fileExists(resolved))) {
    return url;
  }

  const attachmentName = await copyAttachment(resolved, context);
  return `attachments/${encodeURIComponent(attachmentName)}`;
}

async function copyAttachment(sourceFile: string, context: AttachmentContext): Promise<string> {
  const existing = context.nameBySource.get(sourceFile);
  if (existing) {
    return existing;
  }

  await fs.mkdir(context.attachmentsDir, { recursive: true });
  const baseName = basename(sourceFile);
  let targetName = baseName;

  if (context.usedNames.has(baseName)) {
    const relativePath = normalizePath(relative(context.sourceRoot, sourceFile));
    const ext = extname(baseName);
    const nameWithoutExt = relativePath.replace(ext, "").replace(/\//g, "-");
    targetName = `${slugify(nameWithoutExt)}${ext}`;
  }

  context.usedNames.add(targetName);
  context.nameBySource.set(sourceFile, targetName);

  await fs.copyFile(sourceFile, join(context.attachmentsDir, targetName));
  return targetName;
}

function splitUrl(url: string): { pathPart: string; anchor?: string } {
  const [pathPart, anchor] = url.split("#");
  return { pathPart, anchor };
}

function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(url);
}

function encodeTitle(title: string): string {
  return encodeURIComponent(title).replace(/%20/g, "+");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function removeLocalPageDir(workspaceDir: string, pagePath: string): Promise<void> {
  const pageDir = pageDirFromPath(workspaceDir, pagePath);
  await fs.rm(pageDir, { recursive: true, force: true });
}
