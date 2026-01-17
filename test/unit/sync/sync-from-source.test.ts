import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConfig, readConfig, writeConfig } from "../../../src/sync/config.js";
import { syncFromSource } from "../../../src/sync/sync.js";

async function createTempDir(): Promise<string> {
  return fs.mkdtemp(join(tmpdir(), "confluence-md-sync-"));
}

describe("syncFromSource", () => {
  it("maps markdown files to page paths and rewrites links", async () => {
    const workspace = await createTempDir();
    const source = await createTempDir();

    const config = createConfig({ remote: "http://localhost", space: "TEST", type: "space" });
    await writeConfig(workspace, config);

    await fs.mkdir(join(source, "docs", "images"), { recursive: true });
    await fs.writeFile(
      join(source, "docs", "README.md"),
      "# Docs\n\n![Logo](images/logo.png)\n\nSee [Guide](guide.md)",
      "utf8",
    );
    await fs.writeFile(
      join(source, "docs", "guide.md"),
      "# Guide\n\nBack to [Docs](README.md)",
      "utf8",
    );
    await fs.writeFile(join(source, "docs", "images", "logo.png"), "logo", "utf8");

    await syncFromSource(workspace, source);

    const updatedConfig = await readConfig(workspace);
    expect(updatedConfig.paths.docs).toBeDefined();
    expect(updatedConfig.paths["docs/guide"]).toBeDefined();

    const docsMarkdown = await fs.readFile(join(workspace, "docs", "page.md"), "utf8");
    expect(docsMarkdown).toContain("attachments/logo.png");
    expect(docsMarkdown).toContain("confluence://TEST/Guide");

    const guideMarkdown = await fs.readFile(join(workspace, "docs", "guide", "page.md"), "utf8");
    expect(guideMarkdown).toContain("confluence://TEST/Docs");

    const attachmentExists = await fs
      .access(join(workspace, "docs", "attachments", "logo.png"))
      .then(() => true)
      .catch(() => false);
    expect(attachmentExists).toBe(true);

    await fs.rm(workspace, { recursive: true, force: true });
    await fs.rm(source, { recursive: true, force: true });
  });
});
