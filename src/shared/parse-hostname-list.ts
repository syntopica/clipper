import { HostnameEntrySchema } from './hostname-entry-schema'
import { normalizeHostname } from './normalize-hostname'

export type ParsedHostnameList =
  | { ok: true; hostnames: string[] }
  | { ok: false; invalid: string[] }

// Read a textarea of one hostname per line. Blank lines are ignored, entries
// are normalised and de-duplicated, and anything that is not a bare hostname -
// a URL, a path, a wildcard - is reported rather than silently dropped, since a
// dropped denylist entry is a host the user believes is blocked and is not.
export function parseHostnameList(text: string): ParsedHostnameList {
  const entries = text
    .split('\n')
    .map((line) => normalizeHostname(line.trim()))
    .filter((line) => line.length > 0)
  const invalid = entries.filter((entry) => !HostnameEntrySchema.safeParse(entry).success)
  if (invalid.length > 0) return { ok: false, invalid }
  return { ok: true, hostnames: [...new Set(entries)] }
}
