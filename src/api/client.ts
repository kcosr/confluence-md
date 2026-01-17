import { ApiError, AuthenticationError, NotFoundError } from "../errors.js";
import { sleep } from "../utils/sleep.js";
import { type AttachmentsApi, createAttachmentsApi } from "./attachments.js";
import { type LabelsApi, createLabelsApi } from "./labels.js";
import { type PagesApi, createPagesApi } from "./pages.js";
import type { ApiRequestor, RequestOptions } from "./request.js";
import { type SpacesApi, createSpacesApi } from "./spaces.js";
import { type VersionsApi, createVersionsApi } from "./versions.js";

export interface ConfluenceClientOptions {
  baseUrl: string;
  email: string;
  token: string;
  fetch?: typeof fetch;
  maxRetries?: number;
  userAgent?: string;
}

export class ConfluenceClient implements ApiRequestor {
  private readonly apiBaseUrl: string;
  private readonly email: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;
  private readonly maxRetries: number;
  private readonly userAgent?: string;
  private readonly pagesApi: PagesApi;
  private readonly spacesApi: SpacesApi;
  private readonly versionsApi: VersionsApi;
  private readonly attachmentsApi: AttachmentsApi;
  private readonly labelsApi: LabelsApi;

  constructor(options: ConfluenceClientOptions) {
    this.apiBaseUrl = new URL("/wiki/rest/api/", options.baseUrl).toString();
    this.email = options.email;
    this.token = options.token;
    this.fetcher = options.fetch ?? fetch;
    this.maxRetries = options.maxRetries ?? 3;
    this.userAgent = options.userAgent;

    this.pagesApi = createPagesApi(this);
    this.spacesApi = createSpacesApi(this);
    this.versionsApi = createVersionsApi(this);
    this.attachmentsApi = createAttachmentsApi(this);
    this.labelsApi = createLabelsApi(this);
  }

  async requestJson<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const response = await this.request(method, path, options, {
      acceptJson: true,
    });

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  }

  async requestBuffer(method: string, path: string, options?: RequestOptions): Promise<Buffer> {
    const response = await this.request(method, path, options, {
      acceptJson: false,
    });
    const data = await response.arrayBuffer();
    return Buffer.from(data);
  }

  async requestEmpty(method: string, path: string, options?: RequestOptions): Promise<void> {
    await this.request(method, path, options, { acceptJson: true });
  }

  getPage(...args: Parameters<PagesApi["getPage"]>): ReturnType<PagesApi["getPage"]> {
    return this.pagesApi.getPage(...args);
  }

  getPageByTitle(
    ...args: Parameters<PagesApi["getPageByTitle"]>
  ): ReturnType<PagesApi["getPageByTitle"]> {
    return this.pagesApi.getPageByTitle(...args);
  }

  searchPages(...args: Parameters<PagesApi["searchPages"]>): ReturnType<PagesApi["searchPages"]> {
    return this.pagesApi.searchPages(...args);
  }

  createPage(...args: Parameters<PagesApi["createPage"]>): ReturnType<PagesApi["createPage"]> {
    return this.pagesApi.createPage(...args);
  }

  updatePage(...args: Parameters<PagesApi["updatePage"]>): ReturnType<PagesApi["updatePage"]> {
    return this.pagesApi.updatePage(...args);
  }

  deletePage(...args: Parameters<PagesApi["deletePage"]>): ReturnType<PagesApi["deletePage"]> {
    return this.pagesApi.deletePage(...args);
  }

  getChildPages(
    ...args: Parameters<PagesApi["getChildPages"]>
  ): ReturnType<PagesApi["getChildPages"]> {
    return this.pagesApi.getChildPages(...args);
  }

  getDescendantPages(
    ...args: Parameters<PagesApi["getDescendantPages"]>
  ): ReturnType<PagesApi["getDescendantPages"]> {
    return this.pagesApi.getDescendantPages(...args);
  }

  getSpace(...args: Parameters<SpacesApi["getSpace"]>): ReturnType<SpacesApi["getSpace"]> {
    return this.spacesApi.getSpace(...args);
  }

  getSpacePages(
    ...args: Parameters<SpacesApi["getSpacePages"]>
  ): ReturnType<SpacesApi["getSpacePages"]> {
    return this.spacesApi.getSpacePages(...args);
  }

  getHistory(
    ...args: Parameters<VersionsApi["getHistory"]>
  ): ReturnType<VersionsApi["getHistory"]> {
    return this.versionsApi.getHistory(...args);
  }

  getVersions(
    ...args: Parameters<VersionsApi["getVersions"]>
  ): ReturnType<VersionsApi["getVersions"]> {
    return this.versionsApi.getVersions(...args);
  }

  getPageAtVersion(
    ...args: Parameters<VersionsApi["getPageAtVersion"]>
  ): ReturnType<VersionsApi["getPageAtVersion"]> {
    return this.versionsApi.getPageAtVersion(...args);
  }

  getAttachments(
    ...args: Parameters<AttachmentsApi["getAttachments"]>
  ): ReturnType<AttachmentsApi["getAttachments"]> {
    return this.attachmentsApi.getAttachments(...args);
  }

  getAttachmentByFilename(
    ...args: Parameters<AttachmentsApi["getAttachmentByFilename"]>
  ): ReturnType<AttachmentsApi["getAttachmentByFilename"]> {
    return this.attachmentsApi.getAttachmentByFilename(...args);
  }

  downloadAttachment(
    ...args: Parameters<AttachmentsApi["downloadAttachment"]>
  ): ReturnType<AttachmentsApi["downloadAttachment"]> {
    return this.attachmentsApi.downloadAttachment(...args);
  }

  uploadAttachment(
    ...args: Parameters<AttachmentsApi["uploadAttachment"]>
  ): ReturnType<AttachmentsApi["uploadAttachment"]> {
    return this.attachmentsApi.uploadAttachment(...args);
  }

  updateAttachment(
    ...args: Parameters<AttachmentsApi["updateAttachment"]>
  ): ReturnType<AttachmentsApi["updateAttachment"]> {
    return this.attachmentsApi.updateAttachment(...args);
  }

  deleteAttachment(
    ...args: Parameters<AttachmentsApi["deleteAttachment"]>
  ): ReturnType<AttachmentsApi["deleteAttachment"]> {
    return this.attachmentsApi.deleteAttachment(...args);
  }

  getLabels(...args: Parameters<LabelsApi["getLabels"]>): ReturnType<LabelsApi["getLabels"]> {
    return this.labelsApi.getLabels(...args);
  }

  addLabels(...args: Parameters<LabelsApi["addLabels"]>): ReturnType<LabelsApi["addLabels"]> {
    return this.labelsApi.addLabels(...args);
  }

  removeLabel(...args: Parameters<LabelsApi["removeLabel"]>): ReturnType<LabelsApi["removeLabel"]> {
    return this.labelsApi.removeLabel(...args);
  }

  async convertBody(
    content: string,
    from: "storage" | "editor",
    to: "view" | "storage",
  ): Promise<string> {
    const response = await this.requestJson<{ value: string }>(
      "POST",
      `contentbody/convert/${to}`,
      {
        body: { value: content, representation: from },
      },
    );
    return response.value;
  }

  private async request(
    method: string,
    path: string,
    options?: RequestOptions,
    meta?: { acceptJson: boolean },
  ): Promise<Response> {
    const url = this.buildUrl(path, options?.query);
    const headers = new Headers();
    headers.set("Authorization", this.buildAuthHeader());
    if (this.userAgent) {
      headers.set("User-Agent", this.userAgent);
    }
    if (meta?.acceptJson) {
      headers.set("Accept", "application/json");
    }

    const hasJsonBody = options?.body !== undefined && options.rawBody === undefined;
    if (hasJsonBody) {
      headers.set("Content-Type", "application/json");
    }

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }

    const body = hasJsonBody
      ? JSON.stringify(options?.body ?? {})
      : (options?.rawBody ?? undefined);

    const response = await this.fetchWithRetry(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      throw await this.buildError(response, url);
    }

    return response;
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const sanitizedPath = path.replace(/^\/+/, "");
    const url = new URL(sanitizedPath, this.apiBaseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private buildAuthHeader(): string {
    const token = Buffer.from(`${this.email}:${this.token}`).toString("base64");
    return `Basic ${token}`;
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await this.fetcher(url, init);

      if (response.status !== 429 || attempt === this.maxRetries) {
        return response;
      }

      const retryAfter = response.headers.get("retry-after");
      const retryDelaySeconds = retryAfter ? Number.parseInt(retryAfter, 10) : 5;
      const delay = retryDelaySeconds * 1000 * 2 ** attempt;
      await sleep(delay);
    }

    return this.fetcher(url, init);
  }

  private async buildError(response: Response, url: string): Promise<Error> {
    const text = await response.text();

    if (response.status === 401 || response.status === 403) {
      return new AuthenticationError("Authentication failed");
    }

    if (response.status === 404) {
      return new NotFoundError(`Not found: ${url}`);
    }

    return new ApiError(response.status, url, text);
  }
}
