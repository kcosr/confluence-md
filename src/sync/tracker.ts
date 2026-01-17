import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { sha256 } from "../utils/hash.js";
import { pageMarkdownPath } from "../utils/paths.js";

export async function readPageMarkdown(pageDir: string): Promise<string> {
  return fs.readFile(pageMarkdownPath(pageDir), "utf8");
}

export async function writePageMarkdown(pageDir: string, content: string): Promise<void> {
  await fs.mkdir(dirname(pageMarkdownPath(pageDir)), { recursive: true });
  await fs.writeFile(pageMarkdownPath(pageDir), content, "utf8");
}

export async function computePageHash(pageDir: string): Promise<string> {
  const content = await readPageMarkdown(pageDir);
  return sha256(content);
}

export function isContentModified(currentHash: string, storedHash?: string): boolean {
  if (!storedHash) {
    return true;
  }
  return currentHash !== storedHash;
}
