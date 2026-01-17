import { join, normalize } from "node:path";

export function configDirPath(root: string): string {
  return join(root, ".confluence");
}

export function configFilePath(root: string): string {
  return join(configDirPath(root), "config.json");
}

export function pageDirFromPath(root: string, pagePath: string): string {
  if (!pagePath || pagePath === ".") {
    return root;
  }
  return join(root, pagePath);
}

export function pageMarkdownPath(pageDir: string): string {
  return join(pageDir, "page.md");
}

export function attachmentsDirPath(pageDir: string): string {
  return join(pageDir, "attachments");
}

export function normalizePath(path: string): string {
  return normalize(path).replace(/\\/g, "/");
}
