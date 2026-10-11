import { isJobDue } from './is-job-due'
import { JOBS_STORE_NAME } from './jobs-store-name'
import { LEASE_MS } from './lease-ms'
import { openQueueDatabase } from './open-queue-database'
import type { QueuedClipJob } from './queued-clip-job'
import { requestResult } from './request-result'
import { transactionDone } from './transaction-done'

// Claim a job for this worker and mark it `uploading`, in one readwrite
// transaction: IndexedDB serialises overlapping readwrite transactions on a
// store, so a click, an alarm and `onStartup` racing for the same job cannot
// both see it free. Returns the claimed job, or null when it is gone, not due,
// or held by someone else.
export async function acquireLease(
  clipId: string,
  owner: string,
  now: number = Date.now(),
): Promise<QueuedClipJob | null> {
  const database = await openQueueDatabase()
  try {
    const transaction = database.transaction(JOBS_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(JOBS_STORE_NAME)
    const job = (await requestResult(store.get(clipId))) as QueuedClipJob | undefined
    if (job === undefined || !isJobDue(job, now)) {
      await transactionDone(transaction)
      return null
    }
    const leased: QueuedClipJob = {
      ...job,
      state: 'uploading',
      leaseOwner: owner,
      leaseExpiresAt: now + LEASE_MS,
      attemptCount: job.attemptCount + 1,
    }
    store.put(leased)
    await transactionDone(transaction)
    return leased
  } finally {
    database.close()
  }
}
