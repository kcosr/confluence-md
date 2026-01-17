import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import type { ConfluenceClient } from "../api/client.js";
import type { Page } from "../api/types.js";
import { storageToMarkdown } from "../converter/storage-to-md.js";
import type { ConfluenceMdConfig, PageMetadata } from "../types.js";
import { pageDirFromPath, pageMarkdownPath } from "../utils/paths.js";
import { downloadAttachments } from "./attachments.js";
import { readConfig, writeConfig } from "./config.js";
import { hasRemoteChanged } from "./conflict.js";
import { buildPagePathMap } from "./hierarchy.js";
import { writeLabelsFile } from "./labels.js";
import { computePageHash, readPageMarkdown, writePageMarkdown } from "./tracker.js";

export interface PullOptions {
  noAttachments?: boolean;
  noLabels?: boolean;
  writeAttachmentWarnings?: boolean;
}

export async function pull(
  client: ConfluenceClient,
  rootDir: string,
  options: PullOptions,
): Promise<ConfluenceMdConfig> {
  const config = await readConfig(rootDir);

  if (config.type === "space") {
    await pullSpace(client, rootDir, config, options);
  } else {
    await pullSinglePage(client, rootDir, config, options);
  }

  await writeConfig(rootDir, config);
  return config;
}

async function pullSpace(
  client: ConfluenceClient,
  rootDir: string,
  config: ConfluenceMdConfig,
  options: PullOptions,
): Promise<void> {
  const pages = await client.getSpacePages(config.space, { depth: "all" });
  const pathMap = buildPagePathMap(pages);
  const pageById = new Map(pages.map((page) => [page.id, page]));

  for (const [pageId, metadata] of Object.entries(config.pages)) {
    const page = pageById.get(pageId);
    if (!page) {
      continue;
    }
    const newPath = pathMap[pageId] ?? metadata.path;
    if (newPath !== metadata.path) {
      await movePageDir(rootDir, metadata.path, newPath);
      delete config.paths[metadata.path];
      metadata.path = newPath;
      config.paths[newPath] = pageId;
    }
    metadata.title = page.title;
    metadata.parentId = page.ancestors?.length
      ? (page.ancestors[page.ancestors.length - 1]?.id ?? null)
      : null;

    await pullPageContent(client, rootDir, page, metadata, options, config);
  }

  for (const page of pages) {
    if (config.pages[page.id]) {
      continue;
    }
    const path = pathMap[page.id];
    if (!path) {
      continue;
    }
    const metadata: PageMetadata = {
      id: page.id,
      title: page.title,
      parentId: page.ancestors?.length
        ? (page.ancestors[page.ancestors.length - 1]?.id ?? null)
        : null,
      path,
      version: page.version.number,
      lastPulled: new Date().toISOString(),
      localBase: page.version.number,
      contentHash: "",
      labels: [],
      attachments: {},
      deleted: false,
    };
    config.pages[page.id] = metadata;
    config.paths[path] = page.id;
    await pullPageContent(client, rootDir, page, metadata, options, config);
  }
}

async function pullSinglePage(
  client: ConfluenceClient,
  rootDir: string,
  config: ConfluenceMdConfig,
  options: PullOptions,
): Promise<void> {
  const pageEntry = Object.values(config.pages)[0];
  if (!pageEntry?.id) {
    return;
  }
  const page = await client.getPage(pageEntry.id);
  await pullPageContent(client, rootDir, page, pageEntry, options, config);
}

async function pullPageContent(
  client: ConfluenceClient,
  rootDir: string,
  page: Page,
  metadata: PageMetadata,
  options: PullOptions,
  config: ConfluenceMdConfig,
): Promise<void> {
  const pageDir = pageDirFromPath(rootDir, metadata.path);

  let localHash: string | undefined;
  try {
    localHash = await computePageHash(pageDir);
  } catch {
    localHash = undefined;
  }

  const localModified = localHash ? localHash !== metadata.contentHash : false;
  const remoteVersion = page.version.number;
  const remoteChanged = hasRemoteChanged(metadata.localBase, remoteVersion);

  const markdown = storageToMarkdown(page.body?.storage.value ?? "");

  if (localModified && remoteChanged) {
    const remotePath = `${pageMarkdownPath(pageDir)}.remote`;
    await fs.writeFile(remotePath, markdown, "utf8");
  } else if (!localModified || remoteChanged) {
    let content = markdown;

    if (!options.noAttachments) {
      const result = await downloadAttachments(client, page.id, pageDir, {
        maxAttachmentSize: config.settings.maxAttachmentSize,
      });
      metadata.attachments = result.attachments;
      if (options.writeAttachmentWarnings && result.warnings.length > 0) {
        const warnings = result.warnings.map((warning) =>
          formatAttachmentWarning(warning.filename, warning.reason, warning.attachmentId),
        );
        content = `${content}\n\n${warnings.join("\n\n")}`;
      }
    }

    if (!options.noLabels) {
      metadata.labels = (await client.getLabels(page.id)).map((label) => label.name);
      await writeLabelsFile(pageDir, metadata.labels);
    }

    await writePageMarkdown(pageDir, content);
    metadata.contentHash = await computePageHash(pageDir);
    metadata.localBase = remoteVersion;
  }

  metadata.version = remoteVersion;
  metadata.lastPulled = new Date().toISOString();
}

async function movePageDir(rootDir: string, fromPath: string, toPath: string): Promise<void> {
  const from = pageDirFromPath(rootDir, fromPath);
  const to = pageDirFromPath(rootDir, toPath);
  await fs.mkdir(dirname(to), { recursive: true });
  try {
    await fs.rename(from, to);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== "ENOENT") {
      throw error;
    }
  }
}

function formatAttachmentWarning(filename: string, reason: string, attachmentId?: string): string {
  const idPart = attachmentId ? `\n> Original attachment ID: ${attachmentId}` : "";
  return `> ⚠️ **ATTACHMENT NOT SYNCED:** \`${filename}\`  \n> Reason: ${reason}${idPart}`;
}
