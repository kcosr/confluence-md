import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { ConfluenceClient } from "../api/client.js";
import type { AttachmentMetadata } from "../types.js";
import { sha256 } from "../utils/hash.js";
import { attachmentsDirPath } from "../utils/paths.js";

export interface AttachmentWarning {
  filename: string;
  reason: string;
  attachmentId?: string;
}

export interface DownloadAttachmentsOptions {
  maxAttachmentSize: number;
}

export interface DownloadAttachmentsResult {
  attachments: Record<string, AttachmentMetadata>;
  warnings: AttachmentWarning[];
}

export async function downloadAttachments(
  client: ConfluenceClient,
  pageId: string,
  pageDir: string,
  options: DownloadAttachmentsOptions,
): Promise<DownloadAttachmentsResult> {
  const attachments = await client.getAttachments(pageId);
  const attachmentsDir = attachmentsDirPath(pageDir);
  await fs.mkdir(attachmentsDir, { recursive: true });

  const results: Record<string, AttachmentMetadata> = {};
  const warnings: AttachmentWarning[] = [];

  for (const attachment of attachments) {
    const filename = attachment.title;
    const size = attachment.extensions?.fileSize ?? 0;

    if (size > options.maxAttachmentSize) {
      results[filename] = {
        id: attachment.id,
        size,
        status: "skipped",
        reason: `exceeds maxAttachmentSize (${Math.round(options.maxAttachmentSize / (1024 * 1024))}MB)`,
      };
      warnings.push({
        filename,
        reason: results[filename].reason ?? "exceeds maxAttachmentSize",
        attachmentId: attachment.id,
      });
      continue;
    }

    const data = await client.downloadAttachment(pageId, attachment.id);
    const hash = sha256(data);
    const targetPath = join(attachmentsDir, filename);
    await fs.writeFile(targetPath, data);

    results[filename] = {
      id: attachment.id,
      size,
      status: "synced",
      hash,
    };
  }

  return { attachments: results, warnings };
}

export interface UploadAttachmentsOptions {
  maxAttachmentSize: number;
  prune: boolean;
  minorEdit?: boolean;
}

export async function uploadAttachments(
  client: ConfluenceClient,
  pageId: string,
  pageDir: string,
  existing: Record<string, AttachmentMetadata>,
  options: UploadAttachmentsOptions,
): Promise<Record<string, AttachmentMetadata>> {
  const attachmentsDir = attachmentsDirPath(pageDir);
  const localFiles = await listLocalAttachmentFiles(attachmentsDir);
  const nextMetadata: Record<string, AttachmentMetadata> = {};

  for (const filename of localFiles) {
    const filePath = join(attachmentsDir, filename);
    const data = await fs.readFile(filePath);
    const size = data.length;
    const hash = sha256(data);

    if (size > options.maxAttachmentSize) {
      nextMetadata[filename] = {
        id: existing[filename]?.id ?? "",
        size,
        status: "skipped",
        reason: `exceeds maxAttachmentSize (${Math.round(options.maxAttachmentSize / (1024 * 1024))}MB)`,
      };
      continue;
    }

    const current = existing[filename];
    if (current?.hash === hash && current.status === "synced") {
      nextMetadata[filename] = current;
      continue;
    }

    const remote = await client.getAttachmentByFilename(pageId, filename);
    if (remote) {
      const updated = await client.updateAttachment(pageId, remote.id, data, {
        minorEdit: options.minorEdit,
      });
      nextMetadata[filename] = {
        id: updated.id,
        size,
        status: "synced",
        hash,
      };
    } else {
      const created = await client.uploadAttachment(pageId, filename, data, {
        minorEdit: options.minorEdit,
      });
      nextMetadata[filename] = {
        id: created.id,
        size,
        status: "synced",
        hash,
      };
    }
  }

  if (options.prune) {
    const remoteAttachments = await client.getAttachments(pageId);
    for (const attachment of remoteAttachments) {
      if (!localFiles.includes(attachment.title)) {
        await client.deleteAttachment(attachment.id);
      }
    }
  }

  return nextMetadata;
}

async function listLocalAttachmentFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
