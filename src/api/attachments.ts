import { paginate } from "./pagination.js";
import type { ApiRequestor } from "./request.js";
import type { Attachment } from "./types.js";

export interface AttachmentOptions {
  comment?: string;
  minorEdit?: boolean;
}

export interface AttachmentsApi {
  getAttachments(pageId: string): Promise<Attachment[]>;
  getAttachmentByFilename(pageId: string, filename: string): Promise<Attachment | null>;
  downloadAttachment(pageId: string, attachmentId: string): Promise<Buffer>;
  uploadAttachment(
    pageId: string,
    filename: string,
    data: Buffer,
    options?: AttachmentOptions,
  ): Promise<Attachment>;
  updateAttachment(
    pageId: string,
    attachmentId: string,
    data: Buffer,
    options?: AttachmentOptions,
  ): Promise<Attachment>;
  deleteAttachment(attachmentId: string): Promise<void>;
}

export function createAttachmentsApi(client: ApiRequestor): AttachmentsApi {
  return {
    async getAttachments(pageId) {
      return paginate<Attachment>(client, `content/${pageId}/child/attachment`, {
        expand: "version,metadata",
      });
    },

    async getAttachmentByFilename(pageId, filename) {
      const response = await client.requestJson<{ results: Attachment[] }>(
        "GET",
        `content/${pageId}/child/attachment`,
        { query: { filename, expand: "version,metadata" } },
      );

      return response.results?.[0] ?? null;
    },

    async downloadAttachment(pageId, attachmentId) {
      return client.requestBuffer(
        "GET",
        `content/${pageId}/child/attachment/${attachmentId}/download`,
      );
    },

    async uploadAttachment(pageId, filename, data, options) {
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(data)]), filename);
      if (options?.comment) {
        form.append("comment", options.comment);
      }
      if (options?.minorEdit !== undefined) {
        form.append("minorEdit", String(options.minorEdit));
      }

      const response = await client.requestJson<{ results: Attachment[] }>(
        "POST",
        `content/${pageId}/child/attachment`,
        {
          headers: { "X-Atlassian-Token": "nocheck" },
          rawBody: form,
        },
      );

      const attachment = response.results?.[0];
      if (!attachment) {
        throw new Error("Attachment upload returned no results");
      }
      return attachment;
    },

    async updateAttachment(pageId, attachmentId, data, options) {
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(data)]), "attachment");
      if (options?.comment) {
        form.append("comment", options.comment);
      }
      if (options?.minorEdit !== undefined) {
        form.append("minorEdit", String(options.minorEdit));
      }

      const response = await client.requestJson<{ results: Attachment[] }>(
        "POST",
        `content/${pageId}/child/attachment/${attachmentId}/data`,
        {
          headers: { "X-Atlassian-Token": "nocheck" },
          rawBody: form,
        },
      );

      const attachment = response.results?.[0];
      if (!attachment) {
        throw new Error("Attachment update returned no results");
      }
      return attachment;
    },

    async deleteAttachment(attachmentId) {
      await client.requestEmpty("DELETE", `content/${attachmentId}`);
    },
  };
}
