import { paginate } from "./pagination.js";
import type { ApiRequestor } from "./request.js";
import type { Label } from "./types.js";

export interface LabelsApi {
  getLabels(pageId: string): Promise<Label[]>;
  addLabels(pageId: string, labels: string[]): Promise<Label[]>;
  removeLabel(pageId: string, label: string): Promise<void>;
}

export function createLabelsApi(client: ApiRequestor): LabelsApi {
  return {
    async getLabels(pageId) {
      return paginate<Label>(client, `content/${pageId}/label`);
    },

    async addLabels(pageId, labels) {
      const payload = labels.map((label) => ({ prefix: "global", name: label }));
      return client.requestJson<Label[]>("POST", `content/${pageId}/label`, { body: payload });
    },

    async removeLabel(pageId, label) {
      const encoded = encodeURIComponent(label);
      await client.requestEmpty("DELETE", `content/${pageId}/label/${encoded}`);
    },
  };
}
