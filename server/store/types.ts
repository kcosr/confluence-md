export interface StoredVersion {
  number: number;
  by: {
    displayName: string;
    email?: string;
  };
  when: string;
  message: string;
  minorEdit: boolean;
}

export interface StoredPage {
  id: string;
  type: "page" | "blogpost";
  status: "current" | "trashed" | "draft";
  title: string;
  spaceKey: string;
  ancestors: { id: string; title: string }[];
  body: {
    storage: {
      value: string;
      representation: "storage";
    };
  };
  version: StoredVersion;
}

export interface StoredSpace {
  key: string;
  name: string;
  homepageId?: string;
}

export interface StoredAttachment {
  id: string;
  pageId: string;
  title: string;
  mediaType: string;
  comment?: string;
  version: StoredVersion;
  data: string; // base64
  size: number;
}

export interface StoreData {
  pages: Record<string, StoredPage>;
  spaces: Record<string, StoredSpace>;
  versions: Record<string, StoredPage[]>;
  attachments: Record<string, Record<string, StoredAttachment>>;
  labels: Record<string, string[]>;
  nextId: number;
}
