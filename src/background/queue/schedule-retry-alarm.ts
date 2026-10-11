import { listJobs } from './list-jobs'
import { RETRY_ALARM_NAME } from './retry-alarm-name'

// One alarm, set for the earliest job waiting on a retry, and cleared when no
// job is waiting. A queued job cannot wait for "the next event": there may not
// be one for days.
export async function scheduleRetryAlarm(): Promise<void> {
  const waiting = (await listJobs())
    .filter((job) => job.state === 'transient-failure' && job.nextAttemptAt !== null)
    .map((job) => job.nextAttemptAt as number)
  if (waiting.length === 0) {
    await chrome.alarms.clear(RETRY_ALARM_NAME)
    return
  }
  await chrome.alarms.create(RETRY_ALARM_NAME, { when: Math.min(...waiting) })
}
