export function slugify(title: string): string {
  const normalized = title
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return normalized.length > 0 ? normalized : "page";
}

export function ensureUniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) {
    return base;
  }

  let counter = 2;
  let candidate = `${base}-${counter}`;

  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}
