import type { ClipJob } from '../clip-job'
import { handleCapturedPage } from '../handle-captured-page'
import { withKeepalive } from '../with-keepalive'
import { acquireLease } from './acquire-lease'
import { deleteJob } from './delete-job'
import type { JobOutcome } from './job-outcome'
import { jobFailureKind } from './job-failure-kind'
import { MAX_JOB_ATTEMPTS } from './max-job-attempts'
import { putJob } from './put-job'
import { retryDelayMs } from './retry-delay-ms'
import { scheduleRetryAlarm } from './schedule-retry-alarm'
import { WORKER_ID } from './worker-id'

// One attempt at one job, with every transition persisted before the next step:
// leased and `uploading` before the first request, deleted once committed,
// `transient-failure` with its next attempt time, or `permanent-failure`. A
// worker that dies mid-attempt leaves the job `uploading` under a lease that
// lapses, and the next resume takes it again; the clip id makes that safe.
export async function runQueuedJob(
  clipId: string,
  commit: (job: ClipJob) => Promise<{ dirPath: string }> = handleCapturedPage,
): Promise<JobOutcome> {
  const job = await acquireLease(clipId, WORKER_ID)
  if (job === null) return { kind: 'skipped' }

  try {
    const { dirPath } = await withKeepalive(() => commit(job))
    await deleteJob(clipId)
    return { kind: 'committed', job, dirPath }
  } catch (error) {
    const lastError = error instanceof Error ? error.message : String(error)
    const released = { ...job, leaseOwner: null, leaseExpiresAt: null, lastError }
    if (jobFailureKind(error) === 'transient' && job.attemptCount < MAX_JOB_ATTEMPTS) {
      const retrying = {
        ...released,
        state: 'transient-failure' as const,
        nextAttemptAt: Date.now() + retryDelayMs(error, job.attemptCount),
      }
      await putJob(retrying)
      await scheduleRetryAlarm()
      return { kind: 'retrying', job: retrying, error }
    }
    const failed = { ...released, state: 'permanent-failure' as const, nextAttemptAt: null }
    await putJob(failed)
    return { kind: 'failed', job: failed, error }
  }
}
