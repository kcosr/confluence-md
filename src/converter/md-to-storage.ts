import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parseConfluenceBlock } from "./confluence-blocks.js";

const MACRO_WITH_RICH_BODY = new Set(["info", "warning", "note", "tip", "expand"]);

interface RenderContext {
  taskCounter: number;
}

type MdastNode = {
  type: string;
  [key: string]: unknown;
};

type MdastParent = MdastNode & { children?: MdastNode[] };

export function markdownToStorage(markdown: string): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastParent;
  const context: RenderContext = { taskCounter: 1 };
  return renderBlocks(tree.children ?? [], context).trim();
}

function renderBlocks(nodes: MdastNode[], context: RenderContext): string {
  return nodes
    .map((node) => renderBlock(node, context))
    .filter((value) => value.length > 0)
    .join("");
}

function renderBlock(node: MdastNode, context: RenderContext): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(getChildren(node), context)}</p>`;
    case "heading": {
      const depth = (node as { depth?: number }).depth ?? 1;
      return `<h${depth}>${renderInline(getChildren(node), context)}</h${depth}>`;
    }
    case "list":
      return renderList(node, context);
    case "code":
      return renderCodeBlock(node, context);
    case "blockquote":
      return `<blockquote>${renderBlocks(getChildren(node), context)}</blockquote>`;
    case "thematicBreak":
      return "<hr />";
    case "table":
      return renderTable(node, context);
    case "html":
      return String((node as { value?: string }).value ?? "");
    default:
      return renderInline(getChildren(node), context);
  }
}

function renderInline(nodes: MdastNode[], context: RenderContext): string {
  return nodes.map((node) => renderInlineNode(node, context)).join("");
}

function renderInlineNode(node: MdastNode, context: RenderContext): string {
  switch (node.type) {
    case "text":
      return escapeXml(String((node as { value?: string }).value ?? ""));
    case "strong":
      return `<strong>${renderInline(getChildren(node), context)}</strong>`;
    case "emphasis":
      return `<em>${renderInline(getChildren(node), context)}</em>`;
    case "delete":
      return `<del>${renderInline(getChildren(node), context)}</del>`;
    case "inlineCode":
      return `<code>${escapeXml(String((node as { value?: string }).value ?? ""))}</code>`;
    case "break":
      return "<br />";
    case "link":
      return renderLink(node, context);
    case "image":
      return renderImage(node);
    default:
      return renderInline(getChildren(node), context);
  }
}

function renderList(node: MdastNode, context: RenderContext): string {
  const items = getChildren(node);
  const isTaskList = items.some(
    (item) => typeof (item as { checked?: boolean }).checked === "boolean",
  );

  if (isTaskList) {
    return renderTaskList(items, context);
  }

  const tag = (node as { ordered?: boolean }).ordered ? "ol" : "ul";
  const children = items.map((item) => renderListItem(item, context)).join("");
  return `<${tag}>${children}</${tag}>`;
}

function renderListItem(node: MdastNode, context: RenderContext): string {
  const body = renderBlocks(getChildren(node), context);
  return `<li>${body}</li>`;
}

function renderTaskList(items: MdastNode[], context: RenderContext): string {
  const tasks = items
    .map((item) => {
      const status = (item as { checked?: boolean }).checked ? "complete" : "incomplete";
      const body = renderBlocks(getChildren(item), context);
      const id = context.taskCounter++;
      return `<ac:task><ac:task-id>${id}</ac:task-id><ac:task-status>${status}</ac:task-status><ac:task-body>${body}</ac:task-body></ac:task>`;
    })
    .join("");

  return `<ac:task-list>${tasks}</ac:task-list>`;
}

function renderCodeBlock(node: MdastNode, context: RenderContext): string {
  const language = String((node as { lang?: string }).lang ?? "");
  const value = String((node as { value?: string }).value ?? "");

  if (language.startsWith("confluence:")) {
    const macroName = language.slice("confluence:".length);
    const block = parseConfluenceBlock(value, macroName);
    return renderConfluenceMacroBlock(macroName, block, context);
  }

  const params = language
    ? `<ac:parameter ac:name="language">${escapeXml(language)}</ac:parameter>`
    : "";

  return `<ac:structured-macro ac:name="code">${params}<ac:plain-text-body><![CDATA[${value}]]></ac:plain-text-body></ac:structured-macro>`;
}

function renderConfluenceMacroBlock(
  name: string,
  block: ReturnType<typeof parseConfluenceBlock>,
  context: RenderContext,
): string {
  if (name === "raw") {
    const rawName = block.params.name ?? "";
    const body = block.body ?? "";
    return `<ac:structured-macro ac:name="${escapeXml(rawName)}">${body}</ac:structured-macro>`;
  }

  if (name === "mention") {
    const accountId = block.params["account-id"] ?? "";
    const display = block.params.display;
    const body = display
      ? `<ac:plain-text-link-body><![CDATA[${display}]]></ac:plain-text-link-body>`
      : "";
    return `<ac:link><ri:user ri:account-id="${escapeXml(accountId)}" />${body}</ac:link>`;
  }

  if (MACRO_WITH_RICH_BODY.has(name)) {
    const body = block.body ? markdownToStorage(block.body) : "";
    return buildStructuredMacro(
      name,
      block.params,
      body ? `<ac:rich-text-body>${body}</ac:rich-text-body>` : "",
    );
  }

  if (name === "status" || name === "toc") {
    return buildStructuredMacro(name, block.params, "");
  }

  const body = block.body ? markdownToStorage(block.body) : "";
  return buildStructuredMacro(
    name,
    block.params,
    body ? `<ac:rich-text-body>${body}</ac:rich-text-body>` : "",
  );
}

function buildStructuredMacro(name: string, params: Record<string, string>, body: string): string {
  const paramXml = Object.entries(params)
    .map(
      ([key, value]) =>
        `<ac:parameter ac:name="${escapeXml(key)}">${escapeXml(value)}</ac:parameter>`,
    )
    .join("");

  return `<ac:structured-macro ac:name="${escapeXml(name)}">${paramXml}${body}</ac:structured-macro>`;
}

function renderLink(node: MdastNode, context: RenderContext): string {
  const url = String((node as { url?: string }).url ?? "");
  const text = renderInline(getChildren(node), context) || url;

  if (url.startsWith("confluence://")) {
    return renderConfluenceLink(url, text);
  }

  if (isAttachmentPath(url)) {
    const filename = decodeFilename(url);
    return `<ac:link><ri:attachment ri:filename="${escapeXml(filename)}" /><ac:plain-text-link-body><![CDATA[${text}]]></ac:plain-text-link-body></ac:link>`;
  }

  return `<a href="${escapeXml(url)}">${text}</a>`;
}

function renderImage(node: MdastNode): string {
  const url = String((node as { url?: string }).url ?? "");
  const alt = String((node as { alt?: string }).alt ?? "");

  if (isAttachmentPath(url)) {
    const filename = decodeFilename(url);
    const altAttr = alt ? ` ac:alt="${escapeXml(alt)}"` : "";
    return `<ac:image${altAttr}><ri:attachment ri:filename="${escapeXml(filename)}" /></ac:image>`;
  }

  return `<img src="${escapeXml(url)}" alt="${escapeXml(alt)}" />`;
}

function renderConfluenceLink(url: string, text: string): string {
  const [, spaceKey, target] = url.match(/^confluence:\/\/([^/]+)\/(.+)$/) ?? [];
  if (!spaceKey || !target) {
    return `<a href="${escapeXml(url)}">${text}</a>`;
  }

  const decodedTarget = decodeURIComponent(target.replace(/\+/g, "%20"));
  const attrs: string[] = [`ri:space-key=\"${escapeXml(spaceKey)}\"`];

  if (/^\d+$/.test(decodedTarget)) {
    attrs.push(`ri:content-id=\"${escapeXml(decodedTarget)}\"`);
  } else {
    attrs.push(`ri:content-title=\"${escapeXml(decodedTarget)}\"`);
  }

  return `<ac:link><ri:page ${attrs.join(" ")} /><ac:plain-text-link-body><![CDATA[${text}]]></ac:plain-text-link-body></ac:link>`;
}

function renderTable(node: MdastNode, context: RenderContext): string {
  const rows = getChildren(node);
  const rowHtml = rows
    .map((row) => {
      const cells = getChildren(row);
      const cellHtml = cells
        .map((cell) => `<td>${renderInline(getChildren(cell), context)}</td>`)
        .join("");
      return `<tr>${cellHtml}</tr>`;
    })
    .join("");

  return `<table><tbody>${rowHtml}</tbody></table>`;
}

function isAttachmentPath(url: string): boolean {
  return url.startsWith("attachments/") || url.startsWith("./attachments/");
}

function getChildren(node: MdastNode): MdastNode[] {
  const children = (node as MdastParent).children;
  return Array.isArray(children) ? children : [];
}

function decodeFilename(url: string): string {
  const cleaned = url.replace(/^\.\//, "");
  return decodeURIComponent(cleaned.replace(/^attachments\//, ""));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
