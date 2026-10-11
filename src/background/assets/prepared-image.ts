// An image ready to commit: its final bytes and the extension its file gets.
export interface PreparedImage {
  bytes: ArrayBuffer
  extension: string
}
