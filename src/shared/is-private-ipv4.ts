// Whether a dotted IPv4 literal is in a range no clip or asset may reach:
// "this network" 0/8 (0.0.0.0 reaches the local machine), loopback 127/8, the
// RFC 1918 ranges and link-local 169.254/16 (cloud metadata lives there).
// `new URL()` already canonicalises decimal, octal and hex forms to dotted
// quads, so only that form has to be recognised.
export function isPrivateIPv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (!match) return false
  const octets = match.slice(1, 5).map(Number)
  if (octets.some((octet) => octet > 255)) return false
  const [a, b] = octets as [number, number, number, number]
  return (
    a === 0 || // 0.0.0.0/8
    a === 127 || // loopback
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 169 && b === 254) // 169.254.0.0/16 link-local
  )
}
