import type { QueuedClipJob } from './queued-clip-job'

// Whether a job should be picked up now. A permanent failure never is. A job
// another worker holds is not, until that lease lapses - which is how a job
// left `uploading` by a terminated worker gets resumed.
export function isJobDue(job: QueuedClipJob, now: number): boolean {
  if (job.state === 'permanent-failure') return false
  if (job.leaseExpiresAt !== null && job.leaseExpiresAt > now) return false
  return job.nextAttemptAt === null || job.nextAttemptAt <= now
}
