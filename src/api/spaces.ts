import { paginate } from "./pagination.js";
import type { ApiRequestor } from "./request.js";
import type { Page, Space } from "./types.js";

export interface SpacesApi {
  getSpace(spaceKey: string): Promise<Space>;
  getSpacePages(spaceKey: string, options?: { depth?: "all" | "root" }): Promise<Page[]>;
}

export function createSpacesApi(client: ApiRequestor): SpacesApi {
  return {
    async getSpace(spaceKey) {
      return client.requestJson<Space>("GET", `space/${spaceKey}`, {
        query: { expand: "homepage,description" },
      });
    },

    async getSpacePages(spaceKey, options) {
      return paginate<Page>(client, `space/${spaceKey}/content`, {
        type: "page",
        expand: "body.storage,version,ancestors",
        depth: options?.depth,
      });
    },
  };
}
