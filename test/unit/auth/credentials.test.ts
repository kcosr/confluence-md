import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCredentials } from "../../../src/auth/credentials.js";
import { AuthenticationError } from "../../../src/errors.js";

async function writeCredentialsFile(path: string) {
  const payload = {
    profiles: {
      default: {
        url: "https://example.atlassian.net",
        email: "user@example.com",
        token: "token123",
      },
    },
  };

  await fs.writeFile(path, JSON.stringify(payload), "utf8");
}

describe("loadCredentials", () => {
  it("prefers environment credentials", async () => {
    const result = await loadCredentials({
      env: {
        CONFLUENCE_URL: "https://env.atlassian.net",
        CONFLUENCE_EMAIL: "env@example.com",
        CONFLUENCE_TOKEN: "env-token",
      },
    });

    expect(result).toEqual({
      url: "https://env.atlassian.net",
      email: "env@example.com",
      token: "env-token",
    });
  });

  it("loads profile from credentials file", async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), "confluence-md-"));
    const filePath = join(dir, "credentials");
    await writeCredentialsFile(filePath);

    const result = await loadCredentials({ filePath, env: {} });

    expect(result.url).toBe("https://example.atlassian.net");
  });

  it("throws when profile is missing", async () => {
    await expect(
      loadCredentials({
        env: {},
        filePath: join(tmpdir(), "missing-file.json"),
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
