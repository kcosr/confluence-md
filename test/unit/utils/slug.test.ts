import { describe, expect, it } from "vitest";
import { ensureUniqueSlug, slugify } from "../../../src/utils/slug.js";

describe("slugify", () => {
  it("normalizes titles into slugs", () => {
    expect(slugify("My Page")).toBe("my-page");
    expect(slugify("API   Reference")).toBe("api-reference");
    expect(slugify("FAQ & Help")).toBe("faq-help");
  });

  it("falls back when slug is empty", () => {
    expect(slugify("!!!")).toBe("page");
  });
});

describe("ensureUniqueSlug", () => {
  it("returns base when unused", () => {
    expect(ensureUniqueSlug("my-page", new Set(["other"]))).toBe("my-page");
  });

  it("adds numeric suffix when duplicate", () => {
    const existing = new Set(["my-page", "my-page-2"]);
    expect(ensureUniqueSlug("my-page", existing)).toBe("my-page-3");
  });
});
