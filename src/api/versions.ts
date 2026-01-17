import { paginate } from "./pagination.js";
import type { ApiRequestor } from "./request.js";
import type { History, Page, Version } from "./types.js";

export interface VersionsApi {
  getHistory(pageId: string): Promise<History>;
  getVersions(pageId: string): Promise<Version[]>;
  getPageAtVersion(pageId: string, versionNumber: number): Promise<Page>;
}

export function createVersionsApi(client: ApiRequestor): VersionsApi {
  return {
    async getHistory(pageId) {
      return client.requestJson<History>("GET", `content/${pageId}/history`, {
        query: { expand: "previousVersion,nextVersion,lastUpdated" },
      });
    },

    async getVersions(pageId) {
      return paginate<Version>(client, `content/${pageId}/version`);
    },

    async getPageAtVersion(pageId, versionNumber) {
      return client.requestJson<Page>("GET", `content/${pageId}/version/${versionNumber}`, {
        query: { expand: "body.storage" },
      });
    },
  };
}
