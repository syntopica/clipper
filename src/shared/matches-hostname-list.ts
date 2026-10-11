import { normalizeHostname } from './normalize-hostname'

// Whether a host is one of the entries or a subdomain of one.
export function matchesHostnameList(hostname: string, entries: readonly string[]): boolean {
  const host = normalizeHostname(hostname)
  return entries.some((entry) => host === entry || host.endsWith(`.${entry}`))
}
