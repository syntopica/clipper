import { JOBS_STORE_NAME } from './jobs-store-name'
import { openQueueDatabase } from './open-queue-database'
import type { QueuedClipJob } from './queued-clip-job'
import { requestResult } from './request-result'

export async function listJobs(): Promise<QueuedClipJob[]> {
  const database = await openQueueDatabase()
  try {
    const store = database.transaction(JOBS_STORE_NAME, 'readonly').objectStore(JOBS_STORE_NAME)
    return (await requestResult(store.getAll())) as QueuedClipJob[]
  } finally {
    database.close()
  }
}
