import { createTwoFilesPatch, diffLines } from "diff";

export interface DiffOptions {
  fromFile?: string;
  toFile?: string;
  context?: number;
}

export interface DiffStat {
  files: number;
  insertions: number;
  deletions: number;
}

export function createUnifiedDiff(
  fromContent: string,
  toContent: string,
  options: DiffOptions = {},
): string {
  const fromFile = options.fromFile ?? "a";
  const toFile = options.toFile ?? "b";
  const context = options.context ?? 3;

  return createTwoFilesPatch(fromFile, toFile, fromContent, toContent, "", "", { context });
}

export function createDiffStat(fromContent: string, toContent: string): DiffStat {
  const changes = diffLines(fromContent, toContent);
  let insertions = 0;
  let deletions = 0;

  for (const change of changes) {
    const count = countLines(change.value);
    if (change.added) {
      insertions += count;
    }
    if (change.removed) {
      deletions += count;
    }
  }

  return {
    files: 1,
    insertions,
    deletions,
  };
}

export function formatDiffStat(stat: DiffStat): string {
  const fileLabel = stat.files === 1 ? "file" : "files";
  const insertLabel = stat.insertions === 1 ? "insertion" : "insertions";
  const deleteLabel = stat.deletions === 1 ? "deletion" : "deletions";

  return `${stat.files} ${fileLabel} changed, ${stat.insertions} ${insertLabel}(+), ${stat.deletions} ${deleteLabel}(-)`;
}

function countLines(value: string): number {
  if (!value) {
    return 0;
  }
  const lines = value.split("\n");
  return value.endsWith("\n") ? Math.max(lines.length - 1, 0) : lines.length;
}
