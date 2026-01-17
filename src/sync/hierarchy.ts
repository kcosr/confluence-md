import type { Page } from "../api/types.js";
import { normalizePath } from "../utils/paths.js";
import { ensureUniqueSlug, slugify } from "../utils/slug.js";

export function buildPagePathMap(pages: Page[]): Record<string, string> {
  const childrenByParent = new Map<string | null, Page[]>();

  for (const page of pages) {
    const parentId =
      page.ancestors && page.ancestors.length > 0
        ? page.ancestors[page.ancestors.length - 1]?.id
        : null;
    const list = childrenByParent.get(parentId) ?? [];
    list.push(page);
    childrenByParent.set(parentId, list);
  }

  const pathMap: Record<string, string> = {};

  assignPaths(null, "", childrenByParent, pathMap);

  return pathMap;
}

function assignPaths(
  parentId: string | null,
  basePath: string,
  childrenByParent: Map<string | null, Page[]>,
  pathMap: Record<string, string>,
): void {
  const children = childrenByParent.get(parentId) ?? [];
  children.sort((a, b) => a.title.localeCompare(b.title));

  const used = new Set<string>();

  for (const child of children) {
    const slug = ensureUniqueSlug(slugify(child.title), used);
    used.add(slug);
    const path = basePath ? normalizePath(`${basePath}/${slug}`) : slug;
    pathMap[child.id] = path;
    assignPaths(child.id, path, childrenByParent, pathMap);
  }
}
