import { describe, expect, it } from "vitest";
import { sha256 } from "../../../src/utils/hash.js";

describe("sha256", () => {
  it("prefixes the digest with sha256", () => {
    expect(sha256("test")).toBe(
      "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    );
  });
});
