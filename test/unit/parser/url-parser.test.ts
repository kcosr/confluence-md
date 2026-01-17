import { describe, expect, it } from "vitest";
import { parseConfluenceUrl } from "../../../src/parser/url-parser.js";

describe("parseConfluenceUrl", () => {
  it("parses a page URL with title", () => {
    const result = parseConfluenceUrl(
      "https://company.atlassian.net/wiki/spaces/PROJ/pages/123456789/My+Page",
    );

    expect(result).toMatchObject({
      instance: "company.atlassian.net",
      baseUrl: "https://company.atlassian.net",
      spaceKey: "PROJ",
      pageId: "123456789",
      title: "My Page",
      type: "page",
    });
  });

  it("parses a page URL without title", () => {
    const result = parseConfluenceUrl(
      "https://company.atlassian.net/wiki/spaces/PROJ/pages/123456789",
    );

    expect(result).toMatchObject({
      spaceKey: "PROJ",
      pageId: "123456789",
      type: "page",
    });
    expect(result.title).toBeUndefined();
  });

  it("parses a space URL", () => {
    const result = parseConfluenceUrl("https://company.atlassian.net/wiki/spaces/PROJ");

    expect(result).toMatchObject({
      spaceKey: "PROJ",
      type: "space",
    });
  });

  it("parses a space overview URL", () => {
    const result = parseConfluenceUrl("https://company.atlassian.net/wiki/spaces/PROJ/overview");

    expect(result).toMatchObject({
      spaceKey: "PROJ",
      type: "space",
    });
  });

  it("parses a blog URL", () => {
    const result = parseConfluenceUrl(
      "https://company.atlassian.net/wiki/spaces/PROJ/blog/2024/01/02/98765/Release+Notes",
    );

    expect(result).toMatchObject({
      spaceKey: "PROJ",
      pageId: "98765",
      title: "Release Notes",
      type: "blog",
    });
  });

  it("parses a legacy display URL", () => {
    const result = parseConfluenceUrl(
      "https://company.atlassian.net/wiki/display/PROJ/Legacy+Title",
    );

    expect(result).toMatchObject({
      spaceKey: "PROJ",
      title: "Legacy Title",
      type: "page",
    });
  });

  it("throws on unsupported URLs", () => {
    expect(() => parseConfluenceUrl("https://company.atlassian.net/wiki/unknown/path")).toThrow(
      "Unsupported Confluence URL",
    );
  });
});
