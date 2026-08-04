import type { CaptureFailedPayload } from './capture-failed-payload'
import type { ClipAgainPayload } from './clip-again-payload'
import type { CapturedPagePayload } from './handle-captured-page'

// chrome.runtime.onMessage delivers whatever any extension context sent,
// with no guarantee it came from capture-page.ts - guard the shape before
// reading .type so a malformed or unrelated message cannot crash the
// listener.
export function isRuntimeMessage(
  value: unknown,
): value is CapturedPagePayload | CaptureFailedPayload | ClipAgainPayload {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string'
}
