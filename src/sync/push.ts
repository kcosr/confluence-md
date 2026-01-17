import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import type { ConfluenceClient } from "../api/client.js";
import type { Page } from "../api/types.js";
import { markdownToStorage } from "../converter/md-to-storage.js";
import { ConflictError } from "../errors.js";
import type { ConfluenceMdConfig, PageMetadata } from "../types.js";
import { normalizePath, pageDirFromPath, pageMarkdownPath } from "../utils/paths.js";
import { getAttachmentPruneCandidates, uploadAttachments } from "./attachments.js";
import { readConfig, writeConfig } from "./config.js";
import { hasRemoteChanged } from "./conflict.js";
import { readLabelsFile, syncLabelsToRemote } from "./labels.js";
import { computePageHash, readPageMarkdown } from "./tracker.js";

export interface PushOptions {
  dryRun?: boolean;
  minor?: boolean;
  message?: string;
  noLabels?: boolean;
  pruneAttachments?: boolean;
  prunePages?: boolean;
  force?: boolean;
  newPage?: boolean;
  parentId?: string;
}

export interface PushResult {
  createdPages: string[];
  updatedPages: string[];
  deletedPages: string[];
  deletedAttachments: Record<string, string[]>;
}

export async function push(
  client: ConfluenceClient,
  rootDir: string,
  options: PushOptions,
): Promise<PushResult> {
  const config = await readConfig(rootDir);
  const entries = Object.entries(config.pages);

  const result: PushResult = {
    createdPages: [],
    updatedPages: [],
    deletedPages: [],
    deletedAttachments: {},
  };

  const newPages = entries
    .filter(([, metadata]) => !metadata.id)
    .sort(([, a], [, b]) => pathDepth(a.path) - pathDepth(b.path));
  const existingPages = entries.filter(([, metadata]) => metadata.id);

  for (const [pageKey, metadata] of [...newPages, ...existingPages]) {
    await pushPage(client, rootDir, pageKey, metadata, config, options, result);
  }

  await writeConfig(rootDir, config);
  return result;
}

async function pushPage(
  client: ConfluenceClient,
  rootDir: string,
  pageKey: string,
  metadata: PageMetadata,
  config: ConfluenceMdConfig,
  options: PushOptions,
  result: PushResult,
): Promise<void> {
  const pageDir = pageDirFromPath(rootDir, metadata.path);
  const pageExists = await fileExists(pageMarkdownPath(pageDir));

  if (metadata.deleted || !pageExists) {
    if (metadata.id && options.prunePages) {
      result.deletedPages.push(metadata.path);
      if (!options.dryRun) {
        await client.deletePage(metadata.id);
        removePageFromConfig(config, pageKey, metadata.path);
      }
    } else if (!metadata.id && metadata.deleted) {
      removePageFromConfig(config, pageKey, metadata.path);
    }
    return;
  }

  const markdown = await readPageMarkdown(pageDir);
  const storage = markdownToStorage(markdown);
  const contentHash = await computePageHash(pageDir);

  if (!metadata.id) {
    if (!options.newPage) {
      return;
    }
    const parentId = resolveParentId(metadata, config, options.parentId);
    result.createdPages.push(metadata.path);
    if (options.dryRun) {
      return;
    }

    const created = await client.createPage(config.space, metadata.title, storage, parentId);

    const updated = updateConfigAfterPush(pageKey, metadata, config, created, contentHash);
    await postPushSync(client, pageDir, updated, options, config, result);
    return;
  }

  const remote = await client.getPage(metadata.id, { expand: "version" });
  const remoteVersion = remote.version.number;

  if (hasRemoteChanged(metadata.localBase, remoteVersion) && !options.force) {
    throw new ConflictError("Remote page has changed", metadata.localBase, remoteVersion);
  }

  result.updatedPages.push(metadata.path);
  if (options.dryRun) {
    await collectAttachmentPruneCandidates(client, metadata, pageDir, options, result);
    return;
  }

  const expectedVersion = options.force ? remoteVersion : (metadata.localBase ?? remoteVersion);
  const updated = await client.updatePage(metadata.id, metadata.title, storage, expectedVersion, {
    minorEdit: options.minor,
    message: options.message,
    conflictPolicy: options.force ? "update" : "abort",
  });

  const updatedMetadata = updateConfigAfterPush(pageKey, metadata, config, updated, contentHash);
  await postPushSync(client, pageDir, updatedMetadata, options, config, result);
}

function updateConfigAfterPush(
  pageKey: string,
  metadata: PageMetadata,
  config: ConfluenceMdConfig,
  page: Page,
  contentHash: string,
): PageMetadata {
  const updatedKey = page.id;

  metadata.id = page.id;
  metadata.title = page.title;
  metadata.version = page.version.number;
  metadata.lastPushed = new Date().toISOString();
  metadata.localBase = page.version.number;
  metadata.contentHash = contentHash;
  metadata.deleted = false;

  if (pageKey !== updatedKey) {
    delete config.pages[pageKey];
    config.pages[updatedKey] = metadata;
    const pathKey = config.paths[metadata.path];
    if (pathKey === pageKey) {
      config.paths[metadata.path] = updatedKey;
    }
  } else {
    config.pages[pageKey] = metadata;
  }

  return metadata;
}

async function postPushSync(
  client: ConfluenceClient,
  pageDir: string,
  metadata: PageMetadata,
  options: PushOptions,
  config: ConfluenceMdConfig,
  result: PushResult,
): Promise<void> {
  await collectAttachmentPruneCandidates(client, metadata, pageDir, options, result);

  metadata.attachments = await uploadAttachments(
    client,
    metadata.id ?? "",
    pageDir,
    metadata.attachments,
    {
      maxAttachmentSize: config.settings.maxAttachmentSize,
      prune: options.pruneAttachments ?? false,
      minorEdit: options.minor,
    },
  );

  if (!options.noLabels && metadata.id) {
    const labels = await readLabelsFile(pageDir);
    metadata.labels = await syncLabelsToRemote(client, metadata.id, labels);
  }
}

async function collectAttachmentPruneCandidates(
  client: ConfluenceClient,
  metadata: PageMetadata,
  pageDir: string,
  options: PushOptions,
  result: PushResult,
): Promise<void> {
  if (!metadata.id || !options.pruneAttachments) {
    return;
  }

  const candidates = await getAttachmentPruneCandidates(client, metadata.id, pageDir);
  if (candidates.length === 0) {
    return;
  }

  result.deletedAttachments[metadata.path] = candidates.map((candidate) => candidate.filename);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function removePageFromConfig(config: ConfluenceMdConfig, pageKey: string, pagePath: string): void {
  delete config.pages[pageKey];
  if (config.paths[pagePath] === pageKey) {
    delete config.paths[pagePath];
  }
}

function resolveParentId(
  metadata: PageMetadata,
  config: ConfluenceMdConfig,
  fallbackParentId?: string,
): string | undefined {
  if (metadata.parentId) {
    return metadata.parentId;
  }

  const parentPath = normalizePath(dirname(metadata.path));
  if (!parentPath || parentPath === ".") {
    return fallbackParentId;
  }

  const parentKey = config.paths[parentPath];
  if (!parentKey) {
    return fallbackParentId;
  }

  const parent = config.pages[parentKey];
  if (parent?.id) {
    return parent.id;
  }

  if (fallbackParentId) {
    return fallbackParentId;
  }

  throw new Error(`Parent page missing ID for ${metadata.path}`);
}

function pathDepth(path: string): number {
  return path.split("/").filter(Boolean).length;
}
