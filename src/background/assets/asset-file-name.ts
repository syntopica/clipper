// `assets/01-<sha8>.webp`: the position keeps the files in page order, the
// hash prefix keeps a name stable for the same bytes.
export function assetFileName(position: number, sha256: string, extension: string): string {
  return `${String(position).padStart(2, '0')}-${sha256.slice(0, 8)}.${extension}`
}
