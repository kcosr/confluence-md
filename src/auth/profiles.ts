import { AuthenticationError } from "../errors.js";
import {
  type CredentialsProfile,
  getCredentialsFilePath,
  readCredentialsFile,
} from "./credentials.js";

export async function listProfiles(filePath?: string): Promise<string[]> {
  const file = await readCredentialsFile(filePath ?? getCredentialsFilePath());
  return Object.keys(file?.profiles ?? {});
}

export async function getProfile(name: string, filePath?: string): Promise<CredentialsProfile> {
  const file = await readCredentialsFile(filePath ?? getCredentialsFilePath());
  const profile = file?.profiles?.[name];

  if (!profile) {
    throw new AuthenticationError(`Credentials profile not found: ${name}`);
  }

  return profile;
}
