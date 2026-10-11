import { isPrivateNetworkHost } from '../../shared/is-private-network-host'
import type { AssetResult } from './asset-result'

// The asset fetch policy, applied to every URL a clipped page proposes and to
// every redirect hop: https only, port 443 only, no credentials in the URL, and
// no host that names this machine or its network. The page is hostile input -
// without this the extension is an SSRF proxy for any page it clips.
export function vetAssetUrl(candidate: string, base?: string): AssetResult<URL> {
  let url: URL
  try {
    url = new URL(candidate, base)
  } catch {
    return { ok: false, reason: `not a URL: ${candidate}` }
  }
  if (url.protocol !== 'https:') return { ok: false, reason: `not https: ${url.protocol}` }
  // `new URL()` drops a scheme's default port, so 443 reads as ''.
  if (url.port !== '') return { ok: false, reason: `non-standard port: ${url.port}` }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, reason: 'credentials in the URL' }
  }
  if (isPrivateNetworkHost(url.hostname)) {
    return { ok: false, reason: `private or local host: ${url.hostname}` }
  }
  return { ok: true, value: url }
}
