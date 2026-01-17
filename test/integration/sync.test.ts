import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ConfluenceClient } from "../../src/api/client.js";
import { markdownToStorage } from "../../src/converter/md-to-storage.js";
import { storageToMarkdown } from "../../src/converter/storage-to-md.js";
import { cloneFromUrl } from "../../src/sync/clone.js";
import { readConfig } from "../../src/sync/config.js";
import { pull } from "../../src/sync/pull.js";
import { push } from "../../src/sync/push.js";
import { pageDirFromPath, pageMarkdownPath } from "../../src/utils/paths.js";

function getBaseUrl(): string {
  return process.env.CONFLUENCE_TEST_BASE_URL ?? "http://localhost:3000";
}

function createClient(): ConfluenceClient {
  return new ConfluenceClient({
    baseUrl: getBaseUrl(),
    email: "test@example.com",
    token: "token",
  });
}

async function createTempDir(): Promise<string> {
  return fs.mkdtemp(join(tmpdir(), "confluence-md-"));
}

async function cleanupTempDir(path: string): Promise<void> {
  await fs.rm(path, { recursive: true, force: true });
}

function pageUrl(spaceKey: string, pageId: string, title: string): string {
  const encodedTitle = encodeURIComponent(title).replace(/%20/g, "+");
  return `${getBaseUrl()}/wiki/spaces/${spaceKey}/pages/${pageId}/${encodedTitle}`;
}

async function createPage(
  client: ConfluenceClient,
  spaceKey: string,
  title: string,
  markdown: string,
) {
  const storage = markdownToStorage(markdown);
  return client.createPage(spaceKey, title, storage);
}

describe("integration: sync", () => {
  let workspace: string;

  afterEach(async () => {
    if (workspace) {
      await cleanupTempDir(workspace);
      workspace = "";
    }
  });

  it("clones a page and pushes updates", async () => {
    const client = createClient();
    const spaceKey = `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const page = await createPage(client, spaceKey, "Hello World", "Hello **world**");
    const url = pageUrl(spaceKey, page.id, page.title);

    workspace = await createTempDir();
    await cloneFromUrl(client, url, workspace, {
      writeAttachmentWarnings: false,
    });

    const config = await readConfig(workspace);
    const metadata = config.pages[page.id];
    const pageDir = pageDirFromPath(workspace, metadata.path);
    const markdownPath = pageMarkdownPath(pageDir);

    const initial = await fs.readFile(markdownPath, "utf8");
    expect(initial).toContain("Hello **world**");

    await fs.writeFile(markdownPath, `${initial}\n\nMore content`, "utf8");
    await push(client, workspace, {});

    const updated = await client.getPage(page.id);
    const updatedMarkdown = storageToMarkdown(updated.body?.storage.value ?? "");
    expect(updatedMarkdown).toContain("More content");
  });

  it("pulls remote updates", async () => {
    const client = createClient();
    const spaceKey = `TEST${Date.now()}B${Math.floor(Math.random() * 1000)}`;
    const page = await createPage(client, spaceKey, "Remote Update", "Initial");
    const url = pageUrl(spaceKey, page.id, page.title);

    workspace = await createTempDir();
    await cloneFromUrl(client, url, workspace, {});

    const updatedStorage = markdownToStorage("Updated from remote");
    await client.updatePage(page.id, page.title, updatedStorage, page.version.number, {
      conflictPolicy: "update",
    });

    await pull(client, workspace, {});

    const config = await readConfig(workspace);
    const metadata = config.pages[page.id];
    const pageDir = pageDirFromPath(workspace, metadata.path);
    const markdownPath = pageMarkdownPath(pageDir);
    const markdown = await fs.readFile(markdownPath, "utf8");
    expect(markdown).toContain("Updated from remote");
  });

  it("writes .remote file on conflict", async () => {
    const client = createClient();
    const spaceKey = `TEST${Date.now()}C${Math.floor(Math.random() * 1000)}`;
    const page = await createPage(client, spaceKey, "Conflict", "Base");
    const url = pageUrl(spaceKey, page.id, page.title);

    workspace = await createTempDir();
    await cloneFromUrl(client, url, workspace, {});

    const config = await readConfig(workspace);
    const metadata = config.pages[page.id];
    const pageDir = pageDirFromPath(workspace, metadata.path);
    const markdownPath = pageMarkdownPath(pageDir);

    await fs.writeFile(markdownPath, "Local edit", "utf8");

    const updatedStorage = markdownToStorage("Remote edit");
    await client.updatePage(page.id, page.title, updatedStorage, page.version.number, {
      conflictPolicy: "update",
    });

    await pull(client, workspace, {});

    const remotePath = `${markdownPath}.remote`;
    const remoteContent = await fs.readFile(remotePath, "utf8");
    expect(remoteContent).toContain("Remote edit");
  });

  it("syncs attachments and prunes missing files", async () => {
    const client = createClient();
    const spaceKey = `TEST${Date.now()}D${Math.floor(Math.random() * 1000)}`;
    const page = await createPage(client, spaceKey, "Attachments", "Attachments");
    await client.uploadAttachment(page.id, "note.txt", Buffer.from("hello"));
    const url = pageUrl(spaceKey, page.id, page.title);

    workspace = await createTempDir();
    await cloneFromUrl(client, url, workspace, {});

    const config = await readConfig(workspace);
    const metadata = config.pages[page.id];
    const pageDir = pageDirFromPath(workspace, metadata.path);
    const attachmentPath = join(pageDir, "attachments", "note.txt");

    const attachment = await fs.readFile(attachmentPath, "utf8");
    expect(attachment).toBe("hello");

    await fs.rm(attachmentPath);
    await push(client, workspace, { pruneAttachments: true });

    const remoteAttachments = await client.getAttachments(page.id);
    expect(remoteAttachments.length).toBe(0);
  });
});
