import type { ClipJob } from '../clip-job'
import type { ClipJobState } from './clip-job-state'

// A clip job as it is persisted. `clipId` is the key and the idempotency key:
// a job processed twice targets one directory, and the second run stops at the
// `identical` check. A committed job is deleted rather than kept, so every row
// in the store is work that is either pending or failed for good.
export interface QueuedClipJob extends ClipJob {
  // The tab the capture came from, for its badge and icon. It may be gone by
  // the time a retry runs; every use of it tolerates that.
  tabId: number | null
  state: ClipJobState
  nextAttemptAt: number | null
  leaseOwner: string | null
  leaseExpiresAt: number | null
  attemptCount: number
  lastError: string | null
}
