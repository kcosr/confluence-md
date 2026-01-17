import { describe, expect, it } from "vitest";
import {
  parseConfluenceBlock,
  serializeConfluenceBlock,
} from "../../../src/converter/confluence-blocks.js";

describe("confluence blocks", () => {
  it("parses header params and body", () => {
    const raw = ["title=Important", "count=3", "---", "Body line 1", "Body line 2"].join("\n");

    const parsed = parseConfluenceBlock(raw, "info");

    expect(parsed.name).toBe("info");
    expect(parsed.params).toEqual({ title: "Important", count: "3" });
    expect(parsed.body).toBe("Body line 1\nBody line 2");
  });

  it("parses JSON-quoted param values", () => {
    const raw = 'title="Line 1\\nLine 2"';
    const parsed = parseConfluenceBlock(raw, "info");
    expect(parsed.params.title).toBe("Line 1\nLine 2");
  });

  it("serializes with JSON quoting when needed", () => {
    const serialized = serializeConfluenceBlock({
      name: "status",
      params: { title: "Needs = and spaces" },
    });

    expect(serialized).toBe('title="Needs = and spaces"');
  });
});
