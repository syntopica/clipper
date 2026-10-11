import type { AssetResult } from './asset-result'
import { MAX_ASSET_REDIRECTS } from './max-asset-redirects'
import { vetAssetUrl } from './vet-asset-url'

// Fetch one page-proposed asset under the policy: no cookies, and no redirect
// followed blindly. Each `Location` is vetted like the original URL before the
// next request is made, up to three hops.
//
// Chrome hides the target of a redirect from a `redirect: 'manual'` fetch: the
// response is `opaqueredirect`, status 0, no `Location` (measured in an
// extension service worker on 2026-10-11). A hop whose target cannot be read
// cannot be vetted, so it is refused rather than followed - the asset keeps its
// remote URL. Only a response that exposes its `Location` is walked.
export async function fetchVettedAsset(
  candidate: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AssetResult<Blob>> {
  let vetted = vetAssetUrl(candidate)
  for (let hop = 0; ; hop += 1) {
    if (!vetted.ok) return vetted
    let response: Response
    try {
      response = await fetchImpl(vetted.value.href, { credentials: 'omit', redirect: 'manual' })
    } catch (error) {
      return { ok: false, reason: `fetch failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    if (response.type === 'opaqueredirect') {
      return { ok: false, reason: 'redirect target hidden by the browser, not followed' }
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location === null) return { ok: false, reason: `redirect ${response.status} without a location` }
      if (hop >= MAX_ASSET_REDIRECTS) return { ok: false, reason: 'too many redirects' }
      vetted = vetAssetUrl(location, vetted.value.href)
      continue
    }
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` }
    return { ok: true, value: await response.blob() }
  }
}
