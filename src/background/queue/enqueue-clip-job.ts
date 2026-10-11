import type { ClipJob } from '../clip-job'
import { putJob } from './put-job'

// Persist a capture before any network call, so a worker terminated at any
// point after this leaves a job behind rather than a lost clip.
export async function enqueueClipJob(job: ClipJob, tabId: number | null): Promise<void> {
  await putJob({
    ...job,
    tabId,
    state: 'captured',
    nextAttemptAt: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    attemptCount: 0,
    lastError: null,
    assets: null,
  })
}
