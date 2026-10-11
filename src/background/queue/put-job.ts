import { JOBS_STORE_NAME } from './jobs-store-name'
import { openQueueDatabase } from './open-queue-database'
import type { QueuedClipJob } from './queued-clip-job'
import { transactionDone } from './transaction-done'

// Persist one job, resolving only once the write has committed: every state
// transition is durable before the step after it starts.
export async function putJob(job: QueuedClipJob): Promise<void> {
  const database = await openQueueDatabase()
  try {
    const transaction = database.transaction(JOBS_STORE_NAME, 'readwrite')
    transaction.objectStore(JOBS_STORE_NAME).put(job)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}
