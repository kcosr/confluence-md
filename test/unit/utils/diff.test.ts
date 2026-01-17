import { describe, expect, it } from "vitest";
import { createDiffStat, formatDiffStat } from "../../../src/utils/diff.js";

describe("diff stat", () => {
  it("counts insertions and deletions", () => {
    const stat = createDiffStat("one\n", "one\ntwo\n");
    expect(stat.insertions).toBe(1);
    expect(stat.deletions).toBe(0);
  });

  it("formats summary", () => {
    const stat = createDiffStat("a\n", "b\n");
    expect(formatDiffStat(stat)).toBe("1 file changed, 1 insertion(+), 1 deletion(-)");
  });
});
