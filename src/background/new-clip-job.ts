import { clipTimestamp } from '../shared/clip-timestamp'
import { newClipId } from '../shared/new-clip-id'
import type { CapturedPagePayload } from './captured-page-payload'
import type { ClipJob } from './clip-job'

// The enqueue boundary: the only place a clip's identity is minted.
export function newClipJob(payload: CapturedPagePayload, now: Date = new Date()): ClipJob {
  return { clipId: newClipId(), clippedAt: clipTimestamp(now), payload }
}
