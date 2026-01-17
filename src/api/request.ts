export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  query?: QueryParams;
  headers?: Record<string, string>;
  body?: unknown;
  rawBody?: BodyInit | null;
}

export interface ApiRequestor {
  requestJson<T>(method: string, path: string, options?: RequestOptions): Promise<T>;
  requestBuffer(method: string, path: string, options?: RequestOptions): Promise<Buffer>;
  requestEmpty(method: string, path: string, options?: RequestOptions): Promise<void>;
}
