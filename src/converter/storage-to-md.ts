import {
  type StorageElementNode,
  type StorageNode,
  parseStorage,
  stringifyStorage,
} from "../parser/storage-parser.js";
import { formatConfluenceBlock } from "./confluence-blocks.js";

const MACRO_WITH_RICH_BODY = new Set(["info", "warning", "note", "tip"]);

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

function renderInlineCodeSpan(text: string): string {
  const matches = text.match(/`+/g);
  const maxTicks = matches ? Math.max(...matches.map((match) => match.length)) : 0;
  const fence = "`".repeat(maxTicks + 1);
  const needsPadding = /^\s|\s$/.test(text);
  const content = needsPadding ? ` ${text} ` : text;
  return `${fence}${content}${fence}`;
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
      return renderInlineCodeSpan(renderInlineNodes(node.children));
    case "br":
      return "  \n";
    case "a":
      return renderAnchor(node);
    case "ac:link":
      return renderConfluenceLink(node);
    case "ac:image":
      return renderImage(node);
    case "ac:structured-macro":
      return renderInlineMacro(node);
    case "time":
      return node.attrs.datetime ?? "";
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
      .map((cell) => renderTableCell(cell));
    rows.push(cells);
  }

  return rows;
}

/**
 * Render table cell content, handling block-level elements that may appear in cells.
 * Markdown tables only support inline content, so block elements are flattened.
 */
function renderTableCell(node: StorageElementNode): string {
  const parts: string[] = [];

  for (const child of node.children) {
    if (child.type === "text") {
      const text = child.value.trim();
      if (text) parts.push(escapeMarkdownText(text));
      continue;
    }

    const name = child.name;

    if (name === "p") {
      const content = renderCellContent(child.children);
      if (content) parts.push(content);
    } else if (/^h[1-6]$/.test(name)) {
      // Render headers as bold text in table cells
      const content = renderCellContent(child.children);
      if (content) parts.push(`**${content}**`);
    } else if (name === "ul" || name === "ol") {
      // Flatten lists, each item becomes a separate part (joined with <br> later)
      const items = flattenListItems(child);
      for (const item of items) {
        if (item) parts.push(`• ${item}`);
      }
    } else if (name === "ac:structured-macro") {
      const macroContent = renderCellMacro(child);
      if (macroContent) parts.push(macroContent);
    } else if (name === "time") {
      const datetime = child.attrs.datetime ?? "";
      if (datetime) parts.push(datetime);
    } else if (name === "br") {
      // Skip line breaks in cells
    } else {
      const content = renderCellContent([child]);
      if (content) parts.push(content);
    }
  }

  // Join with <br> for line breaks in table cells, escape pipes for markdown tables
  return parts
    .join("<br>")
    .replace(/\n+/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Render content for table cells, handling inline and some block elements.
 */
function renderCellContent(nodes: StorageNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return escapeMarkdownText(node.value);
      }

      const name = node.name;

      switch (name) {
        case "strong":
        case "b":
          return `**${renderCellContent(node.children)}**`;
        case "em":
        case "i":
          return `*${renderCellContent(node.children)}*`;
        case "code":
          return renderInlineCodeSpan(renderCellContent(node.children));
        case "br":
          return " ";
        case "a":
          return renderAnchor(node);
        case "ac:link":
          return renderConfluenceLink(node);
        case "ac:structured-macro":
          return renderCellMacro(node);
        case "time":
          return node.attrs.datetime ?? "";
        case "p":
          return renderCellContent(node.children);
        case "ul":
        case "ol": {
          const items = flattenListItems(node);
          return items.map((item) => `• ${item}`).join("<br>");
        }
        default:
          return renderCellContent(node.children);
      }
    })
    .join("");
}

/**
 * Flatten a list into an array of text items for table cells.
 */
function flattenListItems(node: StorageElementNode): string[] {
  const items: string[] = [];
  const listItems = node.children
    .filter(isElementNode)
    .filter((child) => child.name === "li");

  for (const li of listItems) {
    const content = renderCellContent(li.children).trim();
    if (content) items.push(content);
  }

  return items;
}

/**
 * Render a macro that appears inside a table cell.
 */
function renderCellMacro(node: StorageElementNode): string {
  const name = node.attrs["ac:name"] ?? "";
  const params = extractMacroParams(node);

  // Jira macro: render as the issue key
  if (name === "jira") {
    const key = params.key ?? "";
    return key || "[JIRA]";
  }

  // Code macro: use <pre> with <br> to preserve newlines in table cells
  if (name === "code") {
    const code = extractMacroPlainBody(node);
    // Replace newlines with <br> since actual newlines break markdown tables
    const escaped = escapeHtml(code).replace(/\n/g, "<br>");
    return `<code>${escaped}</code>`;
  }

  // Other macros: try to render plain or rich text body to avoid dropping content
  return renderMacroTableBody(node);
}

/**
 * Render a macro that appears in inline context (lists, paragraphs).
 */
function renderInlineMacro(node: StorageElementNode): string {
  const name = node.attrs["ac:name"] ?? "";
  const params = extractMacroParams(node);

  // Jira macro: render as the issue key
  if (name === "jira") {
    const key = params.key ?? "";
    return key || "[JIRA]";
  }

  // Code macro: render as inline code
  if (name === "code") {
    const code = extractMacroPlainBody(node);
    return renderInlineCodeSpan(code);
  }

  // Status macro: render as text
  if (name === "status") {
    const title = params.title ?? "";
    return title ? `[${title}]` : "";
  }

  // Other inline macros: try to render plain or rich text body to avoid dropping content
  return renderMacroInlineBody(node);
}

function renderMacroInlineBody(node: StorageElementNode): string {
  const plainBody = findChild(node, "ac:plain-text-body");
  if (plainBody) {
    const text = getTextContent(plainBody).trim();
    return text ? escapeMarkdownText(text) : "";
  }

  const richBody = findChild(node, "ac:rich-text-body");
  if (richBody) {
    return renderInlineNodes(richBody.children).trim();
  }

  return "";
}

function renderMacroTableBody(node: StorageElementNode): string {
  const plainBody = findChild(node, "ac:plain-text-body");
  if (plainBody) {
    const text = getTextContent(plainBody).trim();
    return text ? escapeMarkdownText(text) : "";
  }

  const richBody = findChild(node, "ac:rich-text-body");
  if (richBody) {
    return renderCellContent(richBody.children).trim();
  }

  return "";
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

  // Expand/details macros: render as HTML <details> to allow markdown content
  if (name === "expand" || name === "details") {
    const bodyNode = findChild(node, "ac:rich-text-body");
    const body = bodyNode ? renderBlockNodes(bodyNode.children).join("\n\n") : "";
    const title = params.title ?? "Click to expand";
    return `<details>\n<summary>${escapeHtml(title)}</summary>\n\n${body}\n\n</details>`;
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
  return decodeHtmlEntities(value).replace(/([\\`*_\[\]{}()#+\-.!|>])/g, "\\$1");
}

/**
 * Decode common HTML entities that aren't handled by the XML parser.
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&rsquo;": "'",
    "&lsquo;": "'",
    "&rdquo;": '"',
    "&ldquo;": '"',
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&bull;": "•",
    "&middot;": "·",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char);
  }

  // Handle numeric entities like &#8217; (rsquo) and &#x2019;
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));

  return result;
}

function isElementNode(node: StorageNode): node is StorageElementNode {
  return node.type === "element";
}
