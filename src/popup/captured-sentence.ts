// The capture date as a sentence, in the reader's own locale. The stored value
// keeps the offset it was captured with, which is information about where it
// happened - so it is rendered rather than reformatted into UTC.
export function capturedSentence(capturedAt: string | null): string {
  if (capturedAt === null) return ''
  const parsed = new Date(capturedAt)
  if (Number.isNaN(parsed.getTime())) return ''
  return `Captured ${parsed.toLocaleString()}.`
}
