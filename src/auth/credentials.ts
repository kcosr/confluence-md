import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AuthenticationError } from "../errors.js";

export interface CredentialsProfile {
  url: string;
  email: string;
  token: string;
}

export interface CredentialsFile {
  profiles: Record<string, CredentialsProfile>;
}

export interface CredentialsOptions {
  profile?: string;
  filePath?: string;
  env?: NodeJS.ProcessEnv;
}

export function getCredentialsFilePath(): string {
  return join(homedir(), ".confluence-md", "credentials");
}

export async function loadCredentials(
  options: CredentialsOptions = {},
): Promise<CredentialsProfile> {
  const env = options.env ?? process.env;
  const envCredentials = readEnvCredentials(env);

  if (envCredentials) {
    return envCredentials;
  }

  const profileName = options.profile ?? env.CONFLUENCE_PROFILE ?? "default";
  const filePath = options.filePath ?? getCredentialsFilePath();
  const file = await readCredentialsFile(filePath);
  const profile = file?.profiles?.[profileName];

  if (!profile) {
    throw new AuthenticationError(
      `Credentials profile not found: ${profileName}. Set CONFLUENCE_URL/EMAIL/TOKEN or update ${filePath}`,
    );
  }

  return profile;
}

export async function readCredentialsFile(path: string): Promise<CredentialsFile | null> {
  try {
    const raw = await fs.readFile(path, "utf8");
    return JSON.parse(raw) as CredentialsFile;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function readEnvCredentials(env: NodeJS.ProcessEnv): CredentialsProfile | null {
  const url = env.CONFLUENCE_URL;
  const email = env.CONFLUENCE_EMAIL;
  const token = env.CONFLUENCE_TOKEN;

  if (url && email && token) {
    return { url, email, token };
  }

  return null;
}
