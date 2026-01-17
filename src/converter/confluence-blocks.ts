export interface ConfluenceBlock {
  name: string;
  params: Record<string, string>;
  body?: string;
}

export function parseConfluenceBlock(raw: string, name: string): ConfluenceBlock {
  const lines = raw.split(/\r?\n/);
  const separatorIndex = lines.findIndex((line) => line.trim() === "---");
  const headerLines = separatorIndex === -1 ? lines : lines.slice(0, separatorIndex);
  const bodyLines = separatorIndex === -1 ? [] : lines.slice(separatorIndex + 1);

  const params: Record<string, string> = {};
  for (const line of headerLines) {
    if (!line.trim()) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    if (!key) {
      continue;
    }
    const value = rest.join("=");
    params[key.trim()] = parseParamValue(value.trim());
  }

  const body = bodyLines.length > 0 ? bodyLines.join("\n") : undefined;

  return {
    name,
    params,
    body,
  };
}

export function serializeConfluenceBlock(block: ConfluenceBlock): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(block.params)) {
    lines.push(`${key}=${formatParamValue(value)}`);
  }

  if (block.body !== undefined) {
    lines.push("---", block.body);
  }

  return lines.join("\n");
}

export function formatConfluenceBlock(block: ConfluenceBlock): string {
  const content = serializeConfluenceBlock(block);
  if (content.length === 0) {
    return `\`\`\`confluence:${block.name}\n\`\`\``;
  }
  return `\`\`\`confluence:${block.name}\n${content}\n\`\`\``;
}

function parseParamValue(value: string): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('"') || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") {
        return parsed;
      }
    } catch {
      // fall through
    }
  }

  return value;
}

function formatParamValue(value: string): string {
  const requiresQuote = /\s|=|"|\\/u.test(value);
  if (requiresQuote) {
    return JSON.stringify(value);
  }

  return value;
}
