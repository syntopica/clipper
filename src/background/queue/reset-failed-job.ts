import { JOBS_STORE_NAME } from './jobs-store-name'
import { openQueueDatabase } from './open-queue-database'
import type { QueuedClipJob } from './queued-clip-job'
import { requestResult } from './request-result'
import { transactionDone } from './transaction-done'

// Put a permanently failed job back to `captured`, as if it had just been
// queued: the person has fixed what it was waiting on (signed in again, say).
// The clip id and timestamp stay, so a retry of a clip that did land after all
// stops at the `identical` check. Returns false when the job is gone or is not
// a permanent failure - another tab may have retried or discarded it already.
export async function resetFailedJob(clipId: string): Promise<boolean> {
  const database = await openQueueDatabase()
  try {
    const transaction = database.transaction(JOBS_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(JOBS_STORE_NAME)
    const job = (await requestResult(store.get(clipId))) as QueuedClipJob | undefined
    if (job === undefined || job.state !== 'permanent-failure') {
      await transactionDone(transaction)
      return false
    }
    const reset: QueuedClipJob = {
      ...job,
      state: 'captured',
      nextAttemptAt: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      attemptCount: 0,
      lastError: null,
    }
    store.put(reset)
    await transactionDone(transaction)
    return true
  } finally {
    database.close()
  }
}
