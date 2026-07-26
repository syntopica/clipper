// A denylist predicate must be safe for any caller, so normalization happens
// once here rather than at each call site. Three forms of the same host must
// collapse to one comparable string:
//   - case: URLs are case-insensitive.
//   - a trailing dot: "mail.google.com." is the FQDN form of
//     "mail.google.com" and resolves to the same host.
//   - IPv6 brackets: new URL(...).hostname returns "[::1]" for an IPv6
//     literal, brackets included - the bare form is never what callers
//     actually receive from a parsed URL.
export function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
}
