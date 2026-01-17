export function hasRemoteChanged(localBase: number | undefined, remoteVersion: number): boolean {
  if (localBase === undefined) {
    return false;
  }
  return remoteVersion > localBase;
}
