import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import type {
  StoreData,
  StoredAttachment,
  StoredPage,
  StoredSpace,
  StoredVersion,
} from "./types.js";

const DEFAULT_DATA: StoreData = {
  pages: {},
  spaces: {},
  versions: {},
  attachments: {},
  labels: {},
  nextId: 1000,
};

export class FileStore {
  private readonly filePath: string;
  private data: StoreData;

  constructor(dataDir: string) {
    this.filePath = join(dataDir, "store.json");
    this.data = structuredClone(DEFAULT_DATA);
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.data = JSON.parse(raw) as StoreData;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err?.code !== "ENOENT") {
        throw error;
      }
      await this.save();
    }
  }

  async save(): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  getSpace(spaceKey: string): StoredSpace | undefined {
    return this.data.spaces[spaceKey];
  }

  ensureSpace(spaceKey: string): StoredSpace {
    const existing = this.data.spaces[spaceKey];
    if (existing) {
      return existing;
    }

    const created: StoredSpace = { key: spaceKey, name: spaceKey };
    this.data.spaces[spaceKey] = created;
    return created;
  }

  listPages(spaceKey: string): StoredPage[] {
    return Object.values(this.data.pages).filter((page) => page.spaceKey === spaceKey);
  }

  getPage(pageId: string): StoredPage | undefined {
    return this.data.pages[pageId];
  }

  createPage(page: Omit<StoredPage, "id" | "version">, version: StoredVersion): StoredPage {
    const id = String(this.data.nextId++);
    const created: StoredPage = {
      ...page,
      id,
      version,
    };
    this.data.pages[id] = created;
    return created;
  }

  updatePage(pageId: string, update: Omit<StoredPage, "id">): StoredPage {
    this.data.pages[pageId] = { ...update, id: pageId };
    return this.data.pages[pageId];
  }

  deletePage(pageId: string): void {
    delete this.data.pages[pageId];
  }

  getVersions(pageId: string): StoredPage[] {
    return this.data.versions[pageId] ?? [];
  }

  addVersion(pageId: string, page: StoredPage): void {
    const list = this.data.versions[pageId] ?? [];
    list.push(structuredClone(page));
    this.data.versions[pageId] = list;
  }

  getAttachments(pageId: string): StoredAttachment[] {
    return Object.values(this.data.attachments[pageId] ?? {});
  }

  getAttachment(pageId: string, attachmentId: string): StoredAttachment | undefined {
    return this.data.attachments[pageId]?.[attachmentId];
  }

  getAttachmentByFilename(pageId: string, filename: string): StoredAttachment | undefined {
    return Object.values(this.data.attachments[pageId] ?? {}).find(
      (attachment) => attachment.title === filename,
    );
  }

  findAttachmentById(attachmentId: string): StoredAttachment | undefined {
    for (const attachments of Object.values(this.data.attachments)) {
      const found = Object.values(attachments).find((attachment) => attachment.id === attachmentId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  saveAttachment(attachment: StoredAttachment): StoredAttachment {
    const pageAttachments = this.data.attachments[attachment.pageId] ?? {};
    pageAttachments[attachment.id] = attachment;
    this.data.attachments[attachment.pageId] = pageAttachments;
    return attachment;
  }

  deleteAttachment(pageId: string, attachmentId: string): void {
    if (this.data.attachments[pageId]) {
      delete this.data.attachments[pageId][attachmentId];
    }
  }

  nextAttachmentId(): string {
    return `att-${this.data.nextId++}`;
  }

  getLabels(pageId: string): string[] {
    return this.data.labels[pageId] ?? [];
  }

  setLabels(pageId: string, labels: string[]): void {
    this.data.labels[pageId] = labels;
  }
}
