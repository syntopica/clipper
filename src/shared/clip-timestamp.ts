// The clip's `clipped_at`: UTC, to the second. Milliseconds are dropped because
// the timestamp names the clip's directory, which a person reads.
export function clipTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d+Z$/, 'Z')
}
