export type ConfluenceUrlType = "page" | "space" | "blog";

export interface ParsedConfluenceUrl {
  instance: string;
  baseUrl: string;
  spaceKey: string;
  pageId?: string;
  title?: string;
  type: ConfluenceUrlType;
}

function decodeTitle(segment?: string): string | undefined {
  if (!segment) {
    return undefined;
  }

  return decodeURIComponent(segment).replace(/\+/g, " ");
}

function unsupportedUrl(rawUrl: string): never {
  throw new Error(`Unsupported Confluence URL: ${rawUrl}`);
}

export function parseConfluenceUrl(rawUrl: string): ParsedConfluenceUrl {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    unsupportedUrl(rawUrl);
  }

  const baseUrl = `${url.protocol}//${url.host}`;
  const instance = url.host;

  if (segments[0] === "wiki" && segments[1] === "spaces") {
    const spaceKey = segments[2];
    if (!spaceKey) {
      unsupportedUrl(rawUrl);
    }

    const rest = segments.slice(3);

    if (rest.length === 0 || (rest.length === 1 && rest[0] === "overview")) {
      return {
        instance,
        baseUrl,
        spaceKey,
        type: "space",
      };
    }

    if (rest[0] === "pages") {
      const pageId = rest[1];
      if (!pageId) {
        unsupportedUrl(rawUrl);
      }

      return {
        instance,
        baseUrl,
        spaceKey,
        pageId,
        title: decodeTitle(rest[2]),
        type: "page",
      };
    }

    if (rest[0] === "blog") {
      const pageId = rest[4];
      if (!pageId) {
        unsupportedUrl(rawUrl);
      }

      return {
        instance,
        baseUrl,
        spaceKey,
        pageId,
        title: decodeTitle(rest[5]),
        type: "blog",
      };
    }
  }

  if (segments[0] === "wiki" && segments[1] === "display") {
    const spaceKey = segments[2];
    const title = decodeTitle(segments[3]);

    if (!spaceKey || !title) {
      unsupportedUrl(rawUrl);
    }

    return {
      instance,
      baseUrl,
      spaceKey,
      title,
      type: "page",
    };
  }

  unsupportedUrl(rawUrl);
}
