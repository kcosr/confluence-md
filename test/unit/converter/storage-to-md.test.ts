import { describe, expect, it } from "vitest";
import { storageToMarkdown } from "../../../src/converter/storage-to-md.js";

describe("storageToMarkdown", () => {
  it("converts basic paragraphs", () => {
    const md = storageToMarkdown("<p>Hello <strong>world</strong></p>");
    expect(md).toBe("Hello **world**");
  });

  it("converts info macro to confluence block", () => {
    const storage =
      '<ac:structured-macro ac:name="info"><ac:parameter ac:name="title">Note</ac:parameter><ac:rich-text-body><p>Body</p></ac:rich-text-body></ac:structured-macro>';
    const md = storageToMarkdown(storage);
    expect(md).toContain("```confluence:info");
    expect(md).toContain("title=Note");
  });
});
