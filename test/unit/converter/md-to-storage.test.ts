import { describe, expect, it } from "vitest";
import { markdownToStorage } from "../../../src/converter/md-to-storage.js";

describe("markdownToStorage", () => {
  it("converts headings and emphasis", () => {
    const storage = markdownToStorage("# Title\n\nHello *there*.");
    expect(storage).toContain("<h1>Title</h1>");
    expect(storage).toContain("<p>Hello <em>there</em>.</p>");
  });

  it("converts confluence macro blocks", () => {
    const markdown = ["```confluence:info", "title=Note", "---", "Body", "```"].join("\n");

    const storage = markdownToStorage(markdown);
    expect(storage).toContain('<ac:structured-macro ac:name="info">');
    expect(storage).toContain('<ac:parameter ac:name="title">Note</ac:parameter>');
    expect(storage).toContain("<ac:rich-text-body>");
  });
});
