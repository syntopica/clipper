import type { CapturedPagePayload } from './captured-page-payload'

// One capture, as it will be retried. `clipId` and `clippedAt` are minted once,
// when the capture is accepted, and travel with the job: a resumed attempt that
// minted its own would land in a different directory, and the
// `identical`/`conflict` rule that makes resumption safe would never fire.
export interface ClipJob {
  clipId: string
  clippedAt: string
  payload: CapturedPagePayload
}
