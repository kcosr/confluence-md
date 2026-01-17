import type { ApiRequestor, QueryParams } from "./request.js";
import type { PaginatedResponse } from "./types.js";

export async function paginate<T>(
  client: ApiRequestor,
  path: string,
  query: QueryParams = {},
  limit = 50,
): Promise<T[]> {
  const results: T[] = [];
  let start = 0;

  while (true) {
    const response = await client.requestJson<PaginatedResponse<T>>("GET", path, {
      query: { ...query, start, limit },
    });

    results.push(...response.results);

    const hasNext = Boolean(response._links?.next);
    if (!hasNext || response.results.length === 0) {
      break;
    }

    start += limit;
  }

  return results;
}
