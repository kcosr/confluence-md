import type { ConfluenceClient } from "../api/client.js";
import { EXPAND_PAGE_MINIMAL } from "../api/pages.js";
import type { ConfluenceMdConfig } from "../types.js";
import { pageDirFromPath } from "../utils/paths.js";
import { readConfig } from "./config.js";
import { computePageHash } from "./tracker.js";

export interface StatusEntry {
  path: string;
  modified: boolean;
  behind: boolean;
  ahead: boolean;
}

export async function getStatus(rootDir: string): Promise<StatusEntry[]> {
  const config = await readConfig(rootDir);
  return computeStatusEntries(rootDir, config);
}

export async function getStatusWithRemote(
  client: ConfluenceClient,
  rootDir: string,
): Promise<StatusEntry[]> {
  const config = await readConfig(rootDir);
  const remoteVersions = await fetchRemoteVersions(client, config);
  return computeStatusEntries(rootDir, config, remoteVersions);
}

export async function computeStatusEntries(
  rootDir: string,
  config: ConfluenceMdConfig,
  remoteVersions: Record<string, number> = {},
): Promise<StatusEntry[]> {
  const entries: StatusEntry[] = [];

  for (const metadata of Object.values(config.pages)) {
    const pageDir = pageDirFromPath(rootDir, metadata.path);
    let currentHash: string | undefined;
    try {
      currentHash = await computePageHash(pageDir);
    } catch {
      currentHash = undefined;
    }

    const modified = currentHash ? currentHash !== metadata.contentHash : false;
    const localBase = metadata.localBase ?? metadata.version;
    const remoteVersion = metadata.id ? (remoteVersions[metadata.id] ?? metadata.version) : 0;
    const behind = metadata.id ? remoteVersion > localBase : false;
    const ahead = modified;

    entries.push({
      path: metadata.path,
      modified,
      behind,
      ahead,
    });
  }

  return entries;
}

async function fetchRemoteVersions(
  client: ConfluenceClient,
  config: ConfluenceMdConfig,
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    Object.values(config.pages)
      .filter((page) => page.id)
      .map(async (page) => {
        const remote = await client.getPage(page.id ?? "", { expand: EXPAND_PAGE_MINIMAL });
        return [remote.id, remote.version.number] as const;
      }),
  );

  return Object.fromEntries(entries);
}
