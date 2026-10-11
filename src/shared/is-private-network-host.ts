import { isPrivateIPv4 } from './is-private-ipv4'
import { isPrivateIPv6 } from './is-private-ipv6'
import { normalizeHostname } from './normalize-hostname'

// A host that names this machine or its local network by literal: localhost,
// `.local` (mDNS), and private, loopback or link-local addresses in either
// family. It cannot catch a public name that resolves to a private address -
// an extension cannot resolve DNS - which is the residual risk the design
// accepts.
export function isPrivateNetworkHost(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host.endsWith('.local')) return true
  return isPrivateIPv4(host) || isPrivateIPv6(host)
}
