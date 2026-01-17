import { promises as fs } from "node:fs";
import { basename, resolve } from "node:path";
import { Command } from "commander";
import { ConfluenceClient } from "../api/client.js";
import type { Version } from "../api/types.js";
import { loadCredentials } from "../auth/credentials.js";
import { markdownToStorage } from "../converter/md-to-storage.js";
import { storageToMarkdown } from "../converter/storage-to-md.js";
import { ConflictError } from "../errors.js";
import { parseConfluenceUrl } from "../parser/url-parser.js";
import { cloneFromUrl } from "../sync/clone.js";
import { createConfig, createLocalPageKey, readConfig, writeConfig } from "../sync/config.js";
import { pull } from "../sync/pull.js";
import { push } from "../sync/push.js";
import type { PushResult } from "../sync/push.js";
import { getStatus, getStatusWithRemote } from "../sync/status.js";
import { syncFromSource } from "../sync/sync.js";
import { computePageHash, writePageMarkdown } from "../sync/tracker.js";
import type { ConfluenceMdConfig, PageMetadata } from "../types.js";
import { createDiffStat, createUnifiedDiff, formatDiffStat } from "../utils/diff.js";
import { pageDirFromPath, pageMarkdownPath } from "../utils/paths.js";
import { slugify } from "../utils/slug.js";

interface CloneCommandOptions {
  attachments: boolean;
  labels: boolean;
  writeAttachmentWarnings?: boolean;
  profile?: string;
}

interface PullCommandOptions {
  labels: boolean;
  writeAttachmentWarnings?: boolean;
  profile?: string;
}

interface PushCommandOptions {
  to?: string;
  new?: boolean;
  parent?: string;
  dryRun?: boolean;
  minor?: boolean;
  message?: string;
  labels: boolean;
  pruneAttachments?: boolean;
  prunePages?: boolean;
  force?: boolean;
  profile?: string;
}

interface DiffCommandOptions {
  cached?: boolean;
  stat?: boolean;
}

interface SyncCommandOptions {
  prefix?: string;
  prune?: boolean;
}

interface LogCommandOptions {
  n?: string;
  all?: boolean;
  author?: string;
}

export function buildCli(): Command {
  const program = new Command();

  program
    .name("confluence-md")
    .description("Git-style CLI for Confluence ↔ Markdown sync")
    .version("0.0.0")
    .option("--json", "Output JSON")
    .option("--verbose", "Verbose output")
    .option("--no-color", "Disable colored output");

  program
    .command("clone")
    .argument("<url>")
    .argument("[path]")
    .option("--no-attachments", "Skip attachments")
    .option("--no-labels", "Skip labels")
    .option("--write-attachment-warnings", "Insert attachment warnings into page.md")
    .option("--profile <profile>")
    .action(async (url: string, path: string | undefined, options: CloneCommandOptions) => {
      const parsed = parseConfluenceUrl(url);
      const target = path ?? defaultClonePath(parsed);
      const client = await createClient(parsed.baseUrl, options.profile);
      await cloneFromUrl(client, url, resolve(target), {
        noAttachments: !options.attachments,
        noLabels: !options.labels,
        writeAttachmentWarnings: options.writeAttachmentWarnings,
      });
      console.log(`Cloned ${url} into ${target}`);
    });

  program
    .command("sync")
    .argument("<source-path>")
    .description("Sync markdown from a source directory into this workspace")
    .option("--prefix <path>", "Prefix synced pages under a root path")
    .option("--prune", "Mark pages missing from the source for deletion")
    .action(async (sourcePath: string, options: SyncCommandOptions) => {
      const root = process.cwd();
      const result = await syncFromSource(root, sourcePath, {
        prefix: options.prefix,
        prune: options.prune,
      });
      console.log(
        `Synced ${result.updatedPages} pages (${result.createdPages} new), copied ${result.attachmentsCopied} attachments.`,
      );
    });

  program
    .command("pull")
    .argument("[url]")
    .option("--no-labels", "Skip labels")
    .option("--write-attachment-warnings", "Insert attachment warnings into page.md")
    .option("--profile <profile>")
    .action(async (url: string | undefined, options: PullCommandOptions) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const remote = url ? parseConfluenceUrl(url).baseUrl : config.remote;
      const client = await createClient(remote, options.profile);
      await pull(client, root, {
        noLabels: !options.labels,
        writeAttachmentWarnings: options.writeAttachmentWarnings,
      });
      console.log("Pull complete.");
    });

  program
    .command("push")
    .option("--to <url>", "Push to a different remote")
    .option("--new", "Create as new page")
    .option("--parent <url>", "Parent page URL for new pages")
    .option("--dry-run", "Preview changes without uploading")
    .option("--minor", "Mark as minor edit")
    .option("--message <message>", "Set version message")
    .option("--no-labels", "Skip labels")
    .option("--prune-attachments", "Delete remote attachments missing locally")
    .option("--prune-pages", "Delete remote pages missing locally")
    .option("--force", "Overwrite even if remote changed")
    .option("--profile <profile>")
    .action(async (options: PushCommandOptions) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const remote = options.to ? parseConfluenceUrl(options.to).baseUrl : config.remote;
      const client = await createClient(remote, options.profile);
      const parentId = options.parent ? parseConfluenceUrl(options.parent).pageId : undefined;

      try {
        const result = await push(client, root, {
          dryRun: options.dryRun,
          minor: options.minor,
          message: options.message,
          noLabels: !options.labels,
          pruneAttachments: options.pruneAttachments,
          prunePages: options.prunePages,
          force: options.force,
          newPage: options.new,
          parentId,
        });
        if (options.dryRun) {
          printPushPlan(result);
          return;
        }
        console.log("Push complete.");
      } catch (error) {
        if (error instanceof ConflictError) {
          console.error(
            `Warning: Remote page has changed (version ${error.localVersion} → ${error.remoteVersion}). Use --force to overwrite.`,
          );
          return;
        }
        throw error;
      }
    });

  program.command("status").action(async () => {
    const root = process.cwd();
    const config = await readConfig(root);
    const hasRemotePages = Object.values(config.pages).some((page) => page.id);
    const entries =
      config.remote && hasRemotePages
        ? await getStatusWithRemote(await createClient(config.remote), root)
        : await getStatus(root);

    for (const entry of entries) {
      const flags = [
        entry.modified ? "modified" : null,
        entry.ahead ? "ahead" : null,
        entry.behind ? "behind" : null,
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`${entry.path}: ${flags || "clean"}`);
    }
  });

  program
    .command("diff")
    .argument("[arg1]")
    .argument("[arg2]")
    .option("--cached", "Diff storage format that would be pushed")
    .option("--stat", "Show change summary only")
    .action(
      async (arg1: string | undefined, arg2: string | undefined, options: DiffCommandOptions) => {
        const root = process.cwd();
        const config = await readConfig(root);
        const page = primaryPage(config);
        if (!page?.id) {
          throw new Error("No page configured for diff");
        }
        const client = await createClient(config.remote);
        const localPath = pageMarkdownPath(pageDirFromPath(root, page.path));
        const local = await fs.readFile(localPath, "utf8");

        if (options.cached) {
          const remotePage = await client.getPage(page.id, { expand: "body.storage" });
          const localStorage = markdownToStorage(local);
          if (options.stat) {
            const stat = createDiffStat(remotePage.body?.storage.value ?? "", localStorage);
            console.log(formatDiffStat(stat));
            return;
          }
          const diff = createUnifiedDiff(remotePage.body?.storage.value ?? "", localStorage, {
            fromFile: "remote",
            toFile: "local",
          });
          console.log(diff);
          return;
        }

        if (options.stat) {
          const payload = await buildDiffPayload(client, page.id, local, arg1, arg2);
          const stat = createDiffStat(payload.from, payload.to);
          console.log(formatDiffStat(stat));
          return;
        }

        const diff = await generateDiff(client, page.id, local, arg1, arg2);
        console.log(diff);
      },
    );

  program
    .command("log")
    .option("-n <count>", "Show last N versions")
    .option("--all", "Show all versions")
    .option("--author <email>", "Filter by author")
    .action(async (options: LogCommandOptions) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const page = primaryPage(config);
      if (!page?.id) {
        throw new Error("No page configured for log");
      }
      const client = await createClient(config.remote);
      const versions = await client.getVersions(page.id);
      const filtered = options.author
        ? versions.filter((version: Version) => version.by?.email === options.author)
        : versions;
      const limited = options.all ? filtered : filtered.slice(0, Number(options.n) || 20);
      for (const version of limited) {
        console.log(
          `#${version.number} ${version.when} ${version.by.displayName} - ${version.message}`,
        );
      }
    });

  program
    .command("show")
    .argument("<version>")
    .action(async (version: string) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const page = primaryPage(config);
      if (!page?.id) {
        throw new Error("No page configured for show");
      }
      const client = await createClient(config.remote);
      const data = await client.getPageAtVersion(page.id, Number(version));
      const markdown = storageToMarkdown(data.body?.storage.value ?? "");
      console.log(markdown);
    });

  program
    .command("checkout")
    .argument("<version>")
    .action(async (version: string) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const page = primaryPage(config);
      if (!page?.id) {
        throw new Error("No page configured for checkout");
      }
      const client = await createClient(config.remote);
      const data = await client.getPageAtVersion(page.id, Number(version));
      const markdown = storageToMarkdown(data.body?.storage.value ?? "");
      const pageDir = pageDirFromPath(root, page.path);
      await writePageMarkdown(pageDir, markdown);
      page.contentHash = await computePageHash(pageDir);
      page.localBase = Number(version);
      await writeConfig(root, config);
      console.log(`Checked out version ${version}.`);
    });

  program
    .command("revert")
    .argument("<version>")
    .action(async (version: string) => {
      const root = process.cwd();
      const config = await readConfig(root);
      const page = primaryPage(config);
      if (!page?.id) {
        throw new Error("No page configured for revert");
      }
      const client = await createClient(config.remote);
      const data = await client.getPageAtVersion(page.id, Number(version));
      const latest = await client.getPage(page.id, { expand: "version" });
      await client.updatePage(
        page.id,
        page.title,
        data.body?.storage.value ?? "",
        latest.version.number,
        {
          conflictPolicy: "update",
        },
      );
      const pageDir = pageDirFromPath(root, page.path);
      const markdown = storageToMarkdown(data.body?.storage.value ?? "");
      await writePageMarkdown(pageDir, markdown);
      page.contentHash = await computePageHash(pageDir);
      page.version = latest.version.number + 1;
      page.localBase = page.version;
      page.lastPushed = new Date().toISOString();
      await writeConfig(root, config);
      console.log(`Reverted to version ${version}.`);
    });

  program
    .command("init")
    .argument("[url]")
    .action(async (url: string | undefined) => {
      const root = process.cwd();
      const parsed = url ? parseConfluenceUrl(url) : undefined;
      const config = createConfig({
        remote: parsed?.baseUrl ?? "",
        space: parsed?.spaceKey ?? "",
        type: "page",
      });
      const pageKey = createLocalPageKey();
      const title = parsed?.title ?? basename(root);
      config.pages[pageKey] = {
        id: null,
        title,
        parentId: null,
        path: ".",
        version: 0,
        labels: [],
        attachments: {},
        deleted: false,
      };
      config.paths["."] = pageKey;
      await writeConfig(root, config);
      if (!(await fileExists(pageMarkdownPath(root)))) {
        await fs.writeFile(pageMarkdownPath(root), `# ${title}\n`, "utf8");
      }
      console.log("Initialized confluence-md directory.");
    });

  program
    .command("remote")
    .argument("[command]")
    .argument("[url]")
    .action(async (command: string | undefined, url: string | undefined) => {
      const root = process.cwd();
      const config = await readConfig(root);

      if (!command) {
        console.log(config.remote);
        return;
      }

      if (command === "set" && url) {
        const parsed = parseConfluenceUrl(url);
        config.remote = parsed.baseUrl;
        config.space = parsed.spaceKey;
        await writeConfig(root, config);
        console.log(`Remote set to ${parsed.baseUrl}`);
        return;
      }

      if (command === "remove") {
        config.remote = "";
        config.space = "";
        await writeConfig(root, config);
        console.log("Remote removed.");
        return;
      }

      throw new Error("Unsupported remote command");
    });

  program
    .command("config")
    .argument("[key]")
    .argument("[value]")
    .action(async (key: string | undefined, value: string | undefined) => {
      const root = process.cwd();
      const config = await readConfig(root);

      if (!key) {
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      if (value === undefined) {
        console.log(
          JSON.stringify(getConfigValue(config as unknown as Record<string, unknown>, key)),
        );
        return;
      }

      setConfigValue(config as unknown as Record<string, unknown>, key, value);
      await writeConfig(root, config);
      console.log(`Updated ${key}`);
    });

  return program;
}

async function createClient(remote: string, profile?: string): Promise<ConfluenceClient> {
  const credentials = await loadCredentials({ profile });
  const baseUrl = remote || credentials.url;
  return new ConfluenceClient({
    baseUrl,
    email: credentials.email,
    token: credentials.token,
  });
}

function defaultClonePath(parsed: ReturnType<typeof parseConfluenceUrl>): string {
  if (parsed.type === "space") {
    return slugify(parsed.spaceKey);
  }
  return slugify(parsed.title ?? parsed.pageId ?? "page");
}

interface DiffPayload {
  from: string;
  to: string;
  fromFile: string;
  toFile: string;
}

async function buildDiffPayload(
  client: ConfluenceClient,
  pageId: string,
  local: string,
  arg1?: string,
  arg2?: string,
): Promise<DiffPayload> {
  if (arg1 && arg2) {
    const [left, right] = await Promise.all([
      client.getPageAtVersion(pageId, Number(arg1)),
      client.getPageAtVersion(pageId, Number(arg2)),
    ]);
    return {
      from: storageToMarkdown(left.body?.storage.value ?? ""),
      to: storageToMarkdown(right.body?.storage.value ?? ""),
      fromFile: `version-${arg1}`,
      toFile: `version-${arg2}`,
    };
  }

  if (arg1 && /^\d+$/.test(arg1)) {
    const remote = await client.getPageAtVersion(pageId, Number(arg1));
    return {
      from: storageToMarkdown(remote.body?.storage.value ?? ""),
      to: local,
      fromFile: `version-${arg1}`,
      toFile: "local",
    };
  }

  if (arg1?.startsWith("http")) {
    const parsed = parseConfluenceUrl(arg1);
    const page = parsed.pageId
      ? await client.getPage(parsed.pageId)
      : await client.getPageByTitle(parsed.spaceKey, parsed.title ?? "");
    if (!page) {
      throw new Error("Page not found");
    }
    return {
      from: storageToMarkdown(page.body?.storage.value ?? ""),
      to: local,
      fromFile: arg1,
      toFile: "local",
    };
  }

  const remote = await client.getPage(pageId);
  return {
    from: storageToMarkdown(remote.body?.storage.value ?? ""),
    to: local,
    fromFile: "remote",
    toFile: "local",
  };
}

async function generateDiff(
  client: ConfluenceClient,
  pageId: string,
  local: string,
  arg1?: string,
  arg2?: string,
): Promise<string> {
  const payload = await buildDiffPayload(client, pageId, local, arg1, arg2);
  return createUnifiedDiff(payload.from, payload.to, {
    fromFile: payload.fromFile,
    toFile: payload.toFile,
  });
}

function primaryPage(config: ConfluenceMdConfig): PageMetadata | undefined {
  return Object.values(config.pages ?? {})[0];
}

function getConfigValue(config: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, config as unknown);
}

function setConfigValue(config: Record<string, unknown>, key: string, value: string): void {
  const parts = key.split(".");
  let current: Record<string, unknown> = config;
  while (parts.length > 1) {
    const part = parts.shift();
    if (!part) {
      break;
    }
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const last = parts[0];
  if (last) {
    current[last] = value;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function printPushPlan(result: PushResult): void {
  const created = result.createdPages;
  const updated = result.updatedPages;
  const deletedPages = result.deletedPages;
  const deletedAttachments = result.deletedAttachments;

  if (created.length > 0) {
    console.log("Would create pages:");
    for (const path of created) {
      console.log(`  + ${path}`);
    }
  }

  if (updated.length > 0) {
    console.log("Would update pages:");
    for (const path of updated) {
      console.log(`  ~ ${path}`);
    }
  }

  if (deletedPages.length > 0) {
    console.log("Would delete pages:");
    for (const path of deletedPages) {
      console.log(`  - ${path}`);
    }
  }

  const attachmentEntries = Object.entries(deletedAttachments);
  if (attachmentEntries.length > 0) {
    console.log("Would delete attachments:");
    for (const [path, files] of attachmentEntries) {
      console.log(`  ${path}: ${files.join(", ")}`);
    }
  }

  if (
    created.length === 0 &&
    updated.length === 0 &&
    deletedPages.length === 0 &&
    attachmentEntries.length === 0
  ) {
    console.log("No changes to push.");
  }
}
