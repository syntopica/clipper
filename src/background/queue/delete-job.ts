import { JOBS_STORE_NAME } from './jobs-store-name'
import { openQueueDatabase } from './open-queue-database'
import { transactionDone } from './transaction-done'

export async function deleteJob(clipId: string): Promise<void> {
  const database = await openQueueDatabase()
  try {
    const transaction = database.transaction(JOBS_STORE_NAME, 'readwrite')
    transaction.objectStore(JOBS_STORE_NAME).delete(clipId)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}
