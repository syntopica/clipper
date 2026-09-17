import { captureServiceOrigin } from './capture-service-origin'
import type { ClipStatus } from './clip-status'
import { getCaptureToken } from './get-capture-token'
import { HaveResponseSchema } from './have-response-schema'

const ABSENT: ClipStatus = { state: 'absent', clipUrl: null, capturedAt: null }

/**
 * Ask the capture service how far the clip for a URL got.
 *
 * The URL goes over verbatim: the service normalizes it itself, with the same
 * `normalize()` the Python URL index used to key 1485 rows. A second
 * normalization here would be a copy to keep in sync for no gain, and this
 * repository's own `normalizeUrl` answers a different question - what a clip
 * records as its `normalized_url`.
 *
 * **Every failure resolves to `absent`, and that direction is deliberate.** A
 * refused token, an unreachable service, an answer that does not parse: all of
 * them mean "we do not know", and the only safe rendering of not knowing is a
 * grey icon that still clips on one click. Guessing the other way suppresses a
 * capture that never happened, and a lost capture is the failure this whole
 * pipeline is built against; a duplicate is not - the store dedupes it.
 */
export async function fetchClipStatus(url: string): Promise<ClipStatus> {
  const token = await getCaptureToken()
  const origin = await captureServiceOrigin()
  if (token === null || origin === null) return ABSENT
  try {
    const response = await fetch(`${origin}/api/have?url=${encodeURIComponent(url)}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!response.ok) return ABSENT
    const parsed = HaveResponseSchema.safeParse(await response.json())
    if (!parsed.success) return ABSENT
    const { captured, state, clip_url, captured_at } = parsed.data.data
    if (!captured || state === null) return ABSENT
    return { state, clipUrl: clip_url, capturedAt: captured_at }
  } catch {
    return ABSENT
  }
}
