import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ConfluenceClient } from "../api/client.js";
import type { Page } from "../api/types.js";
import { storageToMarkdown } from "../converter/storage-to-md.js";
import { parseConfluenceUrl } from "../parser/url-parser.js";
import type { ConfluenceMdConfig, PageMetadata } from "../types.js";
import { pageDirFromPath } from "../utils/paths.js";
import { downloadAttachments } from "./attachments.js";
import { createConfig, writeConfig } from "./config.js";
import { buildPagePathMap, buildSubtreePathMap } from "./hierarchy.js";
import { writeLabelsFile } from "./labels.js";
import { computePageHash, writePageMarkdown } from "./tracker.js";

export interface CloneOptions {
  noAttachments?: boolean;
  noLabels?: boolean;
  writeAttachmentWarnings?: boolean;
}

export async function cloneFromUrl(
  client: ConfluenceClient,
  url: string,
  targetDir: string,
  options: CloneOptions,
): Promise<ConfluenceMdConfig> {
  const parsed = parseConfluenceUrl(url);
  const config = createConfig({
    remote: parsed.baseUrl,
    space: parsed.spaceKey,
    type: parsed.type === "space" ? "space" : "page",
  });

  await mkdir(targetDir, { recursive: true });

  if (parsed.type === "space") {
    const pages = await client.getSpacePages(parsed.spaceKey, { depth: "all" });
    await cloneSpace(client, pages, targetDir, config, options);
  } else {
    const rootPage = await resolvePage(client, parsed.spaceKey, parsed.pageId, parsed.title);
    await cloneSubtree(client, rootPage, targetDir, config, options);
  }

  await writeConfig(targetDir, config);
  return config;
}

async function cloneSpace(
  client: ConfluenceClient,
  pages: Page[],
  targetDir: string,
  config: ConfluenceMdConfig,
  options: CloneOptions,
): Promise<void> {
  const pathMap = buildPagePathMap(pages);

  for (const page of pages) {
    const path = pathMap[page.id];
    if (!path) {
      continue;
    }
    await clonePage(client, page, targetDir, path, config, options);
  }
}

async function cloneSubtree(
  client: ConfluenceClient,
  rootPage: Page,
  targetDir: string,
  config: ConfluenceMdConfig,
  options: CloneOptions,
): Promise<void> {
  const descendants = await client.getDescendantPages(rootPage.id);
  const descendantPages = await Promise.all(descendants.map((page) => client.getPage(page.id)));
  const pages = [rootPage, ...descendantPages];
  const pathMap = buildSubtreePathMap(rootPage.id, pages);

  for (const page of pages) {
    const path = pathMap[page.id];
    if (!path) {
      continue;
    }
    await clonePage(client, page, targetDir, path, config, options);
  }
}

async function clonePage(
  client: ConfluenceClient,
  page: Page,
  targetDir: string,
  pagePath: string,
  config: ConfluenceMdConfig,
  options: CloneOptions,
): Promise<void> {
  const pageDir = pageDirFromPath(targetDir, pagePath);
  await mkdir(pageDir, { recursive: true });

  const markdown = storageToMarkdown(page.body?.storage.value ?? "");

  let warnings: string[] = [];
  let attachments: PageMetadata["attachments"] = {};

  if (!options.noAttachments) {
    const result = await downloadAttachments(client, page.id, pageDir, {
      maxAttachmentSize: config.settings.maxAttachmentSize,
    });
    attachments = result.attachments;
    warnings = result.warnings.map((warning) =>
      formatAttachmentWarning(warning.filename, warning.reason, warning.attachmentId),
    );
  }

  const contentWithWarnings =
    options.writeAttachmentWarnings && warnings.length > 0
      ? `${markdown}\n\n${warnings.join("\n\n")}`
      : markdown;

  await writePageMarkdown(pageDir, contentWithWarnings);
  const contentHash = await computePageHash(pageDir);

  let labels: string[] = [];
  if (!options.noLabels) {
    labels = (await client.getLabels(page.id)).map((label) => label.name);
    await writeLabelsFile(pageDir, labels);
  }

  const parentId = page.ancestors?.length ? page.ancestors[page.ancestors.length - 1]?.id : null;
  const pageKey = page.id;

  const metadata: PageMetadata = {
    id: page.id,
    title: page.title,
    parentId: parentId ?? null,
    path: pagePath,
    version: page.version.number,
    lastPulled: new Date().toISOString(),
    localBase: page.version.number,
    contentHash,
    labels,
    attachments,
    deleted: false,
  };

  config.pages[pageKey] = metadata;
  config.paths[pagePath] = pageKey;
}

async function resolvePage(
  client: ConfluenceClient,
  spaceKey: string,
  pageId?: string,
  title?: string,
): Promise<Page> {
  if (pageId) {
    return client.getPage(pageId);
  }
  if (!title) {
    throw new Error("Page title or ID is required");
  }
  const page = await client.getPageByTitle(spaceKey, title);
  if (!page) {
    throw new Error(`Page not found: ${title}`);
  }
  return page;
}

function formatAttachmentWarning(filename: string, reason: string, attachmentId?: string): string {
  const idPart = attachmentId ? `\n> Original attachment ID: ${attachmentId}` : "";
  return `> ⚠️ **ATTACHMENT NOT SYNCED:** \`${filename}\`  \n> Reason: ${reason}${idPart}`;
}
