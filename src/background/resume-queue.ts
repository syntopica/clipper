import { isJobDue } from './queue/is-job-due'
import { listJobs } from './queue/list-jobs'
import { scheduleRetryAlarm } from './queue/schedule-retry-alarm'
import { processJob } from './process-job'

// Pick up every job that is due - fresh, waiting out a retry whose time has
// come, or left `uploading` by a worker whose lease has lapsed - one at a
// time, then re-arm the alarm for whatever is still waiting. Runs on browser
// start, on install or update, and when the retry alarm fires.
export async function resumeQueue(): Promise<void> {
  const now = Date.now()
  const due = (await listJobs()).filter((job) => isJobDue(job, now))
  for (const job of due) await processJob(job.clipId)
  await scheduleRetryAlarm()
}
