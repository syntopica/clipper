import { DENYLISTED_HOSTNAMES } from './denylisted-hostnames'
import { isPrivateNetworkHost } from './is-private-network-host'
import { matchesHostnameList } from './matches-hostname-list'

// `userEntries` extends the built-in list; it can never shorten it.
export function isDenylistedHostname(hostname: string, userEntries: readonly string[] = []): boolean {
  if (isPrivateNetworkHost(hostname)) return true
  return matchesHostnameList(hostname, DENYLISTED_HOSTNAMES) || matchesHostnameList(hostname, userEntries)
}
