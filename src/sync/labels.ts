import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { ConfluenceClient } from "../api/client.js";

export function labelsFilePath(pageDir: string): string {
  return join(pageDir, "labels.txt");
}

export async function readLabelsFile(pageDir: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(labelsFilePath(pageDir), "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeLabelsFile(pageDir: string, labels: string[]): Promise<void> {
  const content = labels.join("\n");
  await fs.writeFile(labelsFilePath(pageDir), `${content}\n`, "utf8");
}

export async function syncLabelsToRemote(
  client: ConfluenceClient,
  pageId: string,
  localLabels: string[],
): Promise<string[]> {
  const remoteLabels = await client.getLabels(pageId);
  const remoteNames = new Set(remoteLabels.map((label) => label.name));
  const localNames = new Set(localLabels);

  const toAdd = localLabels.filter((label) => !remoteNames.has(label));
  const toRemove = Array.from(remoteNames).filter((label) => !localNames.has(label));

  if (toAdd.length > 0) {
    await client.addLabels(pageId, toAdd);
  }

  for (const label of toRemove) {
    await client.removeLabel(pageId, label);
  }

  return localLabels;
}
