import { XMLBuilder, XMLParser } from "fast-xml-parser";

export interface StorageTextNode {
  type: "text";
  value: string;
}

export interface StorageElementNode {
  type: "element";
  name: string;
  attrs: Record<string, string>;
  children: StorageNode[];
}

export type StorageNode = StorageTextNode | StorageElementNode;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  trimValues: false,
  processEntities: true,
});

const builder = new XMLBuilder({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
});

export function parseStorage(storage: string): StorageNode[] {
  const wrapped = `<root>${storage}</root>`;
  const parsed = parser.parse(wrapped) as Array<Record<string, unknown>>;
  const rootNode = parsed.find((node) => Object.prototype.hasOwnProperty.call(node, "root"));
  const children = (rootNode?.root as unknown[]) ?? [];
  return convertNodes(children);
}

export function stringifyStorage(nodes: StorageNode[]): string {
  const ordered = buildOrderedNodes(nodes);
  return builder.build(ordered);
}

function convertNodes(nodes: unknown[]): StorageNode[] {
  const result: StorageNode[] = [];

  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }

    const entry = node as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(entry, "#text")) {
      const value = entry["#text"];
      if (typeof value === "string" && value.length > 0) {
        result.push({ type: "text", value });
      }
      continue;
    }

    const name = Object.keys(entry).find((key) => key !== ":@");
    if (!name) {
      continue;
    }

    const rawChildren = entry[name];
    const attrs = (entry[":@"] as Record<string, string>) ?? {};

    const children = Array.isArray(rawChildren) ? convertNodes(rawChildren) : [];

    result.push({
      type: "element",
      name,
      attrs,
      children,
    });
  }

  return result;
}

function buildOrderedNodes(nodes: StorageNode[]): Array<Record<string, unknown>> {
  return nodes.map((node) => {
    if (node.type === "text") {
      return { "#text": node.value };
    }

    const entry: Record<string, unknown> = {
      [node.name]: buildOrderedNodes(node.children),
    };

    if (Object.keys(node.attrs).length > 0) {
      entry[":@"] = node.attrs;
    }

    return entry;
  });
}
