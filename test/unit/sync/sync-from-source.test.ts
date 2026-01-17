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

    await syncFromSource(workspace, source, { prefix: "Project Docs" });

    const updatedConfig = await readConfig(workspace);
    expect(updatedConfig.paths["project-docs"]).toBeDefined();
    expect(updatedConfig.paths["project-docs/docs"]).toBeDefined();
    expect(updatedConfig.paths["project-docs/docs/guide"]).toBeDefined();

    const docsMarkdown = await fs.readFile(
      join(workspace, "project-docs", "docs", "page.md"),
      "utf8",
    );
    expect(docsMarkdown).toContain("attachments/logo.png");
    expect(docsMarkdown).toContain("confluence://TEST/Guide");

    const guideMarkdown = await fs.readFile(
      join(workspace, "project-docs", "docs", "guide", "page.md"),
      "utf8",
    );
    expect(guideMarkdown).toContain("confluence://TEST/Docs");

    const attachmentExists = await fs
      .access(join(workspace, "project-docs", "docs", "attachments", "logo.png"))
      .then(() => true)
      .catch(() => false);
    expect(attachmentExists).toBe(true);

    await fs.rm(workspace, { recursive: true, force: true });
    await fs.rm(source, { recursive: true, force: true });
  });

  it("maps root README into prefix root", async () => {
    const workspace = await createTempDir();
    const source = await createTempDir();

    const config = createConfig({ remote: "http://localhost", space: "TEST", type: "space" });
    await writeConfig(workspace, config);

    await fs.writeFile(join(source, "README.md"), "# Root Doc\n\nHello", "utf8");

    await syncFromSource(workspace, source, { prefix: "Root Docs" });

    const updatedConfig = await readConfig(workspace);
    expect(updatedConfig.paths["root-docs"]).toBeDefined();
    expect(updatedConfig.paths["root-docs/readme"]).toBeUndefined();

    const rootMarkdown = await fs.readFile(join(workspace, "root-docs", "page.md"), "utf8");
    expect(rootMarkdown).toContain("Root Doc");

    await fs.rm(workspace, { recursive: true, force: true });
    await fs.rm(source, { recursive: true, force: true });
  });

  it("uses page root when syncing a page workspace", async () => {
    const workspace = await createTempDir();
    const source = await createTempDir();

    const config = createConfig({ remote: "http://localhost", space: "TEST", type: "page" });
    config.pages.root = {
      id: "root-id",
      title: "Root Page",
      parentId: null,
      path: ".",
      version: 1,
      labels: [],
      attachments: {},
    };
    config.paths["."] = "root";

    await writeConfig(workspace, config);

    await fs.mkdir(join(source, "docs"), { recursive: true });
    await fs.writeFile(join(source, "README.md"), "# Root Doc\n\nHello", "utf8");
    await fs.writeFile(join(source, "docs", "guide.md"), "# Guide\n\nHi", "utf8");

    await syncFromSource(workspace, source);

    const updatedConfig = await readConfig(workspace);
    expect(updatedConfig.paths["."]).toBe("root");
    expect(updatedConfig.paths.docs).toBeDefined();
    const docsKey = updatedConfig.paths.docs;
    expect(updatedConfig.pages[docsKey]?.parentId).toBe("root-id");

    const rootMarkdown = await fs.readFile(join(workspace, "page.md"), "utf8");
    expect(rootMarkdown).toContain("Root Doc");

    await fs.rm(workspace, { recursive: true, force: true });
    await fs.rm(source, { recursive: true, force: true });
  });
});
