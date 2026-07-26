import { DENYLISTED_HOSTNAMES } from './denylisted-hostnames'

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

function isPrivateIPv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (!match) return false
  const octets = match.slice(1, 5).map(Number)
  if (octets.some((octet) => octet > 255)) return false
  const [a, b] = octets as [number, number, number, number]
  return (
    a === 127 || // loopback
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 169 && b === 254) // 169.254.0.0/16 link-local
  )
}

export function isDenylistedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (LOOPBACK_HOSTNAMES.has(host)) return true
  if (host.endsWith('.local')) return true
  if (isPrivateIPv4(host)) return true
  return DENYLISTED_HOSTNAMES.some((entry) => host === entry || host.endsWith(`.${entry}`))
}
