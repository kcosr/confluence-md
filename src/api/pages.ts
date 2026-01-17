import { ApiError, ConflictError, NotFoundError } from "../errors.js";
import { paginate } from "./pagination.js";
import type { ApiRequestor, QueryParams } from "./request.js";
import type { Page } from "./types.js";

export const EXPAND_PAGE_FULL = "body.storage,version,space,ancestors,history";
export const EXPAND_PAGE_MINIMAL = "version,space";
export const EXPAND_VERSION = "body.storage";

export interface UpdatePageOptions {
  minorEdit?: boolean;
  conflictPolicy?: "abort" | "update";
  message?: string;
}

export interface PagesApi {
  getPage(pageId: string, options?: { version?: number; expand?: string }): Promise<Page>;
  getPageByTitle(spaceKey: string, title: string): Promise<Page | null>;
  searchPages(cql: string, options?: { expand?: string }): Promise<Page[]>;
  createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<Page>;
  updatePage(
    pageId: string,
    title: string,
    content: string,
    version: number,
    options?: UpdatePageOptions,
  ): Promise<Page>;
  deletePage(pageId: string): Promise<void>;
  getChildPages(pageId: string, options?: { expand?: string }): Promise<Page[]>;
  getDescendantPages(pageId: string, options?: { expand?: string }): Promise<Page[]>;
}

export function createPagesApi(client: ApiRequestor): PagesApi {
  return {
    async getPage(pageId, options) {
      const query: QueryParams = {
        expand: options?.expand ?? EXPAND_PAGE_FULL,
      };

      if (options?.version) {
        query.version = options.version;
        query.expand = EXPAND_VERSION;
      }

      return client.requestJson<Page>("GET", `content/${pageId}`, { query });
    },

    async getPageByTitle(spaceKey, title) {
      const response = await client.requestJson<{ results: Page[] }>("GET", "content", {
        query: {
          spaceKey,
          title,
          expand: "body.storage,version",
        },
      });

      return response.results?.[0] ?? null;
    },

    async searchPages(cql, options) {
      return paginate<Page>(client, "content/search", {
        cql,
        expand: options?.expand ?? "body.storage,version",
      });
    },

    async createPage(spaceKey, title, content, parentId) {
      const body = {
        type: "page",
        title,
        space: { key: spaceKey },
        ancestors: parentId ? [{ id: parentId }] : undefined,
        body: {
          storage: {
            value: content,
            representation: "storage",
          },
        },
      };

      return client.requestJson<Page>("POST", "content", { body });
    },

    async updatePage(pageId, title, content, version, options) {
      const conflictPolicy = options?.conflictPolicy ?? "abort";
      const body = {
        version: {
          number: version + 1,
          minorEdit: options?.minorEdit ?? false,
          message: options?.message,
        },
        title,
        type: "page",
        body: {
          storage: {
            value: content,
            representation: "storage",
          },
        },
      };

      try {
        return await client.requestJson<Page>("PUT", `content/${pageId}`, {
          query: { conflictPolicy },
          body,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          throw new ConflictError("Remote page has changed", version);
        }
        if (error instanceof ApiError && error.status === 404) {
          throw new NotFoundError(`Page not found: ${pageId}`);
        }
        throw error;
      }
    },

    async deletePage(pageId) {
      await client.requestEmpty("DELETE", `content/${pageId}`);
    },

    async getChildPages(pageId, options) {
      return paginate<Page>(client, `content/${pageId}/child/page`, {
        expand: options?.expand ?? EXPAND_PAGE_MINIMAL,
      });
    },

    async getDescendantPages(pageId, options) {
      return paginate<Page>(client, `content/${pageId}/descendant/page`, {
        expand: options?.expand ?? EXPAND_PAGE_MINIMAL,
      });
    },
  };
}
