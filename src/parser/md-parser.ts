import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

export type MarkdownAst = Root;

export function parseMarkdown(content: string): MarkdownAst {
  return unified().use(remarkParse).use(remarkGfm).parse(content) as MarkdownAst;
}

export function stringifyMarkdown(tree: MarkdownAst): string {
  return unified().use(remarkStringify).use(remarkGfm).stringify(tree);
}
