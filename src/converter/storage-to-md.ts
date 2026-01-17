import {
  type StorageElementNode,
  type StorageNode,
  parseStorage,
  stringifyStorage,
} from "../parser/storage-parser.js";
import { formatConfluenceBlock } from "./confluence-blocks.js";

const MACRO_WITH_RICH_BODY = new Set(["info", "warning", "note", "tip", "expand"]);

export function storageToMarkdown(storage: string): string {
  const nodes = parseStorage(storage);
  const blocks = renderBlockNodes(nodes);
  return blocks.join("\n\n").trim();
}

function renderBlockNodes(nodes: StorageNode[]): string[] {
  const blocks: string[] = [];

  for (const node of nodes) {
    const block = renderBlock(node);
    if (!block) {
      continue;
    }
    blocks.push(block);
  }

  return blocks;
}

function renderBlock(node: StorageNode): string | null {
  if (node.type === "text") {
    const text = node.value.trim();
    return text.length ? text : null;
  }

  const name = node.name;

  if (name === "p") {
    return renderInlineNodes(node.children).trim();
  }

  if (name === "blockquote") {
    const inner = renderBlockNodes(node.children).join("\n");
    return inner
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  if (/^h[1-6]$/.test(name)) {
    const depth = Number.parseInt(name.slice(1), 10);
    const prefix = "#".repeat(depth);
    return `${prefix} ${renderInlineNodes(node.children).trim()}`;
  }

  if (name === "ul" || name === "ol") {
    return renderList(node, name === "ol");
  }

  if (name === "table") {
    return renderTable(node);
  }

  if (name === "ac:structured-macro") {
    return renderMacro(node);
  }

  if (name === "ac:task-list") {
    return renderTaskList(node);
  }

  if (name === "ac:image") {
    return renderImage(node);
  }

  if (name === "ac:link") {
    return renderInlineNodes([node]).trim();
  }

  if (name === "pre") {
    const code = renderInlineNodes(node.children);
    return `\`\`\`\n${code}\n\`\`\``;
  }

  return renderInlineNodes(node.children).trim();
}

function renderInlineNodes(nodes: StorageNode[]): string {
  return nodes.map((node) => renderInlineNode(node)).join("");
}

function renderInlineNode(node: StorageNode): string {
  if (node.type === "text") {
    return escapeMarkdownText(node.value);
  }

  const name = node.name;

  switch (name) {
    case "strong":
    case "b":
      return `**${renderInlineNodes(node.children)}**`;
    case "em":
    case "i":
      return `*${renderInlineNodes(node.children)}*`;
    case "code":
      return `\`${renderInlineNodes(node.children)}\``;
    case "br":
      return "  \n";
    case "a":
      return renderAnchor(node);
    case "ac:link":
      return renderConfluenceLink(node);
    case "ac:image":
      return renderImage(node);
    default:
      return renderInlineNodes(node.children);
  }
}

function renderList(node: StorageElementNode, ordered: boolean, depth = 0): string {
  const items = node.children.filter(isElementNode).filter((child) => child.name === "li");
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  items.forEach((item, index) => {
    const { text, nested } = splitListItem(item);
    const marker = ordered ? `${index + 1}.` : "-";
    if (text.trim().length > 0) {
      lines.push(`${indent}${marker} ${text}`);
    }
    for (const nestedList of nested) {
      lines.push(renderList(nestedList, nestedList.name === "ol", depth + 1));
    }
  });

  return lines.join("\n");
}

function splitListItem(item: StorageElementNode): {
  text: string;
  nested: StorageElementNode[];
} {
  const textParts: string[] = [];
  const nested: StorageElementNode[] = [];

  for (const child of item.children) {
    if (isElementNode(child) && (child.name === "ul" || child.name === "ol")) {
      nested.push(child);
      continue;
    }

    if (isElementNode(child) && child.name === "p") {
      textParts.push(renderInlineNodes(child.children));
      continue;
    }

    textParts.push(renderInlineNode(child));
  }

  return { text: textParts.join(" ").trim(), nested };
}

function renderTable(node: StorageElementNode): string {
  const rows = collectTableRows(node);
  if (rows.length === 0) {
    return "";
  }

  const header = rows[0];
  const bodyRows = rows.slice(1);
  const colCount = Math.max(...rows.map((row) => row.length));

  const normalizedHeader = normalizeRow(header, colCount);
  const headerLine = `| ${normalizedHeader.join(" | ")} |`;
  const separatorLine = `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`;

  const bodyLines = bodyRows.map((row) => `| ${normalizeRow(row, colCount).join(" | ")} |`);

  return [headerLine, separatorLine, ...bodyLines].join("\n");
}

function collectTableRows(node: StorageElementNode): string[][] {
  const rows: string[][] = [];

  const rowElements = findElements(node, "tr");
  for (const row of rowElements) {
    const cells = row.children
      .filter(isElementNode)
      .filter((child) => child.name === "td" || child.name === "th")
      .map((cell) => renderInlineNodes(cell.children).trim());
    rows.push(cells);
  }

  return rows;
}

function normalizeRow(row: string[], colCount: number): string[] {
  const normalized = row.slice(0, colCount);
  while (normalized.length < colCount) {
    normalized.push("");
  }
  return normalized;
}

function renderMacro(node: StorageElementNode): string {
  const name = node.attrs["ac:name"] ?? "";
  const params = extractMacroParams(node);

  if (name === "code") {
    const language = params.language ?? "";
    const code = extractMacroPlainBody(node);
    return `\`\`\`${language}\n${code}\n\`\`\``.trim();
  }

  if (MACRO_WITH_RICH_BODY.has(name)) {
    const bodyNode = findChild(node, "ac:rich-text-body");
    const body = bodyNode ? renderBlockNodes(bodyNode.children).join("\n\n") : undefined;
    return formatConfluenceBlock({ name, params, body });
  }

  if (name === "status" || name === "toc") {
    return formatConfluenceBlock({ name, params });
  }

  const rawBody = stringifyStorage(node.children);
  return formatConfluenceBlock({
    name: "raw",
    params: { name },
    body: rawBody,
  });
}

function renderTaskList(node: StorageElementNode): string {
  const tasks = node.children.filter(isElementNode).filter((child) => child.name === "ac:task");
  const lines: string[] = [];

  for (const task of tasks) {
    const statusNode = findChild(task, "ac:task-status");
    const bodyNode = findChild(task, "ac:task-body");
    const status = statusNode ? getTextContent(statusNode).trim() : "incomplete";
    const body = bodyNode ? renderInlineNodes(bodyNode.children).trim() : "";
    const marker = status === "complete" ? "x" : " ";
    lines.push(`- [${marker}] ${body}`.trim());
  }

  return lines.join("\n");
}

function renderImage(node: StorageElementNode): string {
  const attachment = findChild(node, "ri:attachment");
  if (!attachment) {
    return "";
  }
  const filename = attachment.attrs["ri:filename"] ?? "";
  const alt = node.attrs["ac:alt"] ?? node.attrs["ac:title"] ?? filename;
  return `![${escapeMarkdownText(alt)}](attachments/${encodeURIComponent(filename)})`;
}

function renderAnchor(node: StorageElementNode): string {
  const href = node.attrs.href ?? "";
  const text = renderInlineNodes(node.children);
  return `[${text}](${href})`;
}

function renderConfluenceLink(node: StorageElementNode): string {
  const page = findChild(node, "ri:page");
  const attachment = findChild(node, "ri:attachment");
  const user = findChild(node, "ri:user");
  const linkBody = findChild(node, "ac:plain-text-link-body");
  const linkText = linkBody ? getTextContent(linkBody).trim() : undefined;

  if (page) {
    const spaceKey = page.attrs["ri:space-key"] ?? "";
    const contentId = page.attrs["ri:content-id"];
    const title = page.attrs["ri:content-title"];
    const target = contentId ?? encodeTitle(title ?? "");
    const text = linkText ?? title ?? contentId ?? "link";
    return `[${text}](confluence://${spaceKey}/${target})`;
  }

  if (attachment) {
    const filename = attachment.attrs["ri:filename"] ?? "";
    const text = linkText ?? filename;
    return `[${text}](attachments/${encodeURIComponent(filename)})`;
  }

  if (user) {
    const accountId = user.attrs["ri:account-id"] ?? "";
    const display = linkText ?? user.attrs["ri:display-name"] ?? accountId;
    return formatConfluenceBlock({
      name: "mention",
      params: {
        "account-id": accountId,
        display,
      },
    });
  }

  const text = linkText ?? renderInlineNodes(node.children).trim();
  return text;
}

function extractMacroParams(node: StorageElementNode): Record<string, string> {
  const params: Record<string, string> = {};

  for (const child of node.children) {
    if (child.type !== "element" || child.name !== "ac:parameter") {
      continue;
    }
    const paramName = child.attrs["ac:name"] ?? "";
    if (!paramName) {
      continue;
    }
    params[paramName] = getTextContent(child).trim();
  }

  return params;
}

function extractMacroPlainBody(node: StorageElementNode): string {
  const body = findChild(node, "ac:plain-text-body");
  if (!body) {
    return "";
  }
  return getTextContent(body);
}

function findChild(node: StorageElementNode, name: string): StorageElementNode | null {
  for (const child of node.children) {
    if (child.type === "element" && child.name === name) {
      return child;
    }
  }
  return null;
}

function findElements(node: StorageElementNode, name: string): StorageElementNode[] {
  const results: StorageElementNode[] = [];
  for (const child of node.children) {
    if (child.type === "element") {
      if (child.name === name) {
        results.push(child);
      }
      results.push(...findElements(child, name));
    }
  }
  return results;
}

function getTextContent(node: StorageElementNode): string {
  return node.children
    .map((child) => {
      if (child.type === "text") {
        return child.value;
      }
      if (child.type === "element") {
        return getTextContent(child);
      }
      return "";
    })
    .join("");
}

function encodeTitle(title: string): string {
  return encodeURIComponent(title).replace(/%20/g, "+");
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_\[\]{}()#+\-.!|>])/g, "\\$1");
}

function isElementNode(node: StorageNode): node is StorageElementNode {
  return node.type === "element";
}
