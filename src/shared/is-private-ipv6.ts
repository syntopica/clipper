import { isPrivateIPv4 } from './is-private-ipv4'

// Whether a bare IPv6 literal (no brackets, lower case) is loopback,
// unspecified, link-local fe80::/10, unique-local fc00::/7, or an IPv4-mapped
// address whose IPv4 half is private. Prefix checks, not a full parse: enough
// for the canonical forms `new URL()` produces.
export function isPrivateIPv6(hostname: string): boolean {
  if (!hostname.includes(':')) return false
  if (hostname === '::1' || hostname === '::') return true
  if (/^fe[89ab][0-9a-f]?:/.test(hostname)) return true
  if (/^f[cd][0-9a-f]{0,2}:/.test(hostname)) return true
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(hostname)
  if (mapped) {
    const high = Number.parseInt(mapped[1] as string, 16)
    const low = Number.parseInt(mapped[2] as string, 16)
    return isPrivateIPv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`)
  }
  const dotted = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(hostname)
  return dotted !== null && isPrivateIPv4(dotted[1] as string)
}
