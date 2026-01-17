import { createHash } from "node:crypto";

export function sha256(content: string | Buffer): string {
  const hash = createHash("sha256");
  hash.update(content);
  return `sha256:${hash.digest("hex")}`;
}
