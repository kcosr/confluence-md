import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { NotConfluenceMdDirectoryError } from "../errors.js";
import type { ConfigSettings, ConfluenceMdConfig, PageMetadata, PageType } from "../types.js";
import { configFilePath } from "../utils/paths.js";

const CONFIG_VERSION = 1;
const DEFAULT_MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

const DEFAULT_SETTINGS: ConfigSettings = {
  maxAttachmentSize: DEFAULT_MAX_ATTACHMENT_SIZE,
  syncLabels: true,
};

export function createLocalPageKey(): string {
  return `local:${randomUUID()}`;
}

export function createConfig(options: {
  remote: string;
  space: string;
  type: PageType;
  settings?: Partial<ConfigSettings>;
}): ConfluenceMdConfig {
  return {
    version: CONFIG_VERSION,
    remote: options.remote,
    space: options.space,
    type: options.type,
    settings: {
      ...DEFAULT_SETTINGS,
      ...options.settings,
    },
    pages: {},
    paths: {},
  };
}

export async function readConfig(root: string): Promise<ConfluenceMdConfig> {
  const path = configFilePath(root);

  try {
    const raw = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<ConfluenceMdConfig>;
    return normalizeConfig(parsed);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      throw new NotConfluenceMdDirectoryError(
        "Not a confluence-md directory (no .confluence/config.json found)",
      );
    }
    throw error;
  }
}

export async function writeConfig(root: string, config: ConfluenceMdConfig): Promise<void> {
  const path = configFilePath(root);
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function normalizeConfig(raw: Partial<ConfluenceMdConfig>): ConfluenceMdConfig {
  if (!raw.type) {
    throw new Error("Invalid config: missing type");
  }

  const type = normalizePageType(raw.type);
  const pages = (raw.pages ?? {}) as Record<string, PageMetadata>;
  const paths = raw.paths ?? buildPathsIndex(pages);

  return {
    version: raw.version ?? CONFIG_VERSION,
    remote: raw.remote ?? "",
    space: raw.space ?? "",
    type,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings ?? {}),
    },
    pages,
    paths,
  };
}

export function buildPathsIndex(pages: Record<string, PageMetadata>): Record<string, string> {
  return Object.fromEntries(Object.entries(pages).map(([pageKey, page]) => [page.path, pageKey]));
}

function normalizePageType(type: PageType | string): PageType {
  if (type === "page" || type === "space") {
    return type;
  }

  throw new Error(`Invalid config: unsupported type ${type}`);
}
