export type PageType = "page" | "space";

export type AttachmentStatus = "synced" | "skipped";

export interface AttachmentMetadata {
  id: string;
  hash?: string;
  size: number;
  status: AttachmentStatus;
  reason?: string;
}

export interface PageMetadata {
  id: string | null;
  title: string;
  parentId: string | null;
  path: string;
  version: number;
  lastPulled?: string;
  lastPushed?: string;
  localBase?: number;
  contentHash?: string;
  labels: string[];
  attachments: Record<string, AttachmentMetadata>;
}

export interface ConfigSettings {
  maxAttachmentSize: number;
  syncLabels: boolean;
}

export interface ConfluenceMdConfig {
  version: number;
  remote: string;
  space: string;
  type: PageType;
  settings: ConfigSettings;
  pages: Record<string, PageMetadata>;
  paths: Record<string, string>;
}
