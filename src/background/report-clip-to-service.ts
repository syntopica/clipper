import { getCaptureToken } from '../shared/get-capture-token'
import { pushClipState } from '../shared/push-clip-state'
import { recordCapture } from '../shared/record-capture'
import { forgetCachedStatus } from './forget-cached-status'

/**
 * Tell the capture service that this machine just wrote a clip.
 *
 * This is the half of the reconciliation that closes the loop. The desktop lane
 * commits to GitHub and the service never heard about it, which is exactly why
 * two stores of "which URLs exist" drifted apart in the first place.
 *
 * It never throws. The clip is committed by the time this runs - the commit is
 * the thing that matters, the service is a mirror of it, and a mirror that
 * missed one is repaired by re-running the Mac's backfill. Reporting a
 * successful capture as failed because a web service was down would be a far
 * worse trade. A machine with no capture token lands here too, and keeps
 * clipping.
 */
export async function reportClipToService(url: string, clipDir: string): Promise<void> {
  try {
    const token = await getCaptureToken()
    if (token === null) return
    const captureId = await recordCapture(token, url)
    await pushClipState(token, captureId, 'captured', clipDir)
    await forgetCachedStatus(url)
  } catch (error) {
    console.warn('brain clipper: could not tell the capture service about the clip', error)
  }
}
