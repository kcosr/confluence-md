import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { markdownToStorage } from "../src/converter/md-to-storage.js";

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

async function main(): Promise<void> {
  const baseUrl = getArg("--base-url") ?? process.env.CONFLUENCE_URL ?? "http://localhost:3000";
  const spaceKey = getArg("--space") ?? process.env.CONFLUENCE_SPACE ?? "TEST";
  const title = getArg("--title") ?? process.env.CONFLUENCE_PAGE_TITLE ?? "Test Page";
  const email = getArg("--email") ?? process.env.CONFLUENCE_EMAIL ?? "test@example.com";
  const token = getArg("--token") ?? process.env.CONFLUENCE_TOKEN ?? "token";
  const markdownFile = getArg("--markdown-file");

  let markdown =
    getArg("--markdown") ??
    process.env.CONFLUENCE_MARKDOWN ??
    "# Test Page\n\nHello from confluence-md";

  if (markdownFile) {
    markdown = await readFile(resolve(markdownFile), "utf8");
  }

  const storage = markdownToStorage(markdown);

  const response = await fetch(`${baseUrl}/wiki/rest/api/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
    },
    body: JSON.stringify({
      type: "page",
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: storage,
          representation: "storage",
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to create page (${response.status})`);
    console.error(text || response.statusText);
    process.exit(1);
  }

  const data = (await response.json()) as { id?: string };
  const pageId = data.id ?? "";
  const encodedTitle = encodeURIComponent(title).replace(/%20/g, "+");
  const cloneUrl = `${baseUrl}/wiki/spaces/${spaceKey}/pages/${pageId}/${encodedTitle}`;

  console.log(`Created page ${pageId} in space ${spaceKey}`);
  console.log(`Clone URL: ${cloneUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
