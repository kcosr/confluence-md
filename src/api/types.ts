export interface ConfluenceUser {
  displayName: string;
  email?: string;
  userKey?: string;
  accountId?: string;
}

export interface Version {
  number: number;
  by: ConfluenceUser;
  when: string;
  message: string;
  minorEdit: boolean;
}

export interface PageLink {
  webui?: string;
  self?: string;
}

export interface PageAncestor {
  id: string;
  title?: string;
}

export interface Page {
  id: string;
  type: "page" | "blogpost";
  status: "current" | "trashed" | "draft";
  title: string;
  space: { key: string; name?: string };
  version: Version;
  ancestors?: PageAncestor[];
  body?: {
    storage: { value: string; representation: "storage" };
  };
  _links?: PageLink;
}

export interface Space {
  id?: string;
  key: string;
  name?: string;
  description?: unknown;
  homepage?: { id: string; title?: string };
}

export interface AttachmentLink {
  download?: string;
  self?: string;
}

export interface Attachment {
  id: string;
  title: string;
  metadata?: {
    mediaType?: string;
    comment?: string;
  };
  extensions?: {
    fileSize?: number;
  };
  version?: Version;
  _links?: AttachmentLink;
}

export interface Label {
  prefix: "global" | "personal";
  name: string;
  id?: string;
}

export interface History {
  lastUpdated?: Version;
  previousVersion?: Version;
  nextVersion?: Version;
}

export type ContentRepresentation = "storage" | "editor" | "view" | "export_view" | "styled_view";

export interface ContentBody {
  value: string;
  representation: ContentRepresentation;
}

export interface ContentBodyConversionResult {
  value: string;
  representation: ContentRepresentation;
}

export interface PaginatedResponse<T> {
  results: T[];
  start?: number;
  limit?: number;
  size?: number;
  _links?: {
    next?: string;
  };
}
