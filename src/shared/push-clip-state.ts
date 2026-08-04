import { CAPTURE_SERVICE_ORIGIN } from './capture-service-origin'
import type { ClipState } from './clip-state'

// Tell the service how far a clip got. The same call marks the capture drained,
// which is correct rather than a side effect: the caller is holding the clip, so
// there is nothing left for the Mac's drain to fetch.
export async function pushClipState(
  token: string,
  captureId: string,
  state: Exclude<ClipState, 'absent'>,
  clipDir: string,
): Promise<void> {
  const response = await fetch(
    `${CAPTURE_SERVICE_ORIGIN}/api/captures/${encodeURIComponent(captureId)}`,
    {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ state, clip_dir: clipDir }),
    },
  )
  if (!response.ok) throw new Error(`pushing the clip state returned ${response.status}`)
}
