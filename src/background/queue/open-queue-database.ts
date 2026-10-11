import { JOBS_STORE_NAME } from './jobs-store-name'
import { QUEUE_DATABASE_NAME } from './queue-database-name'

// IndexedDB rather than chrome.storage.local: a job carries the whole page
// (markdown and snapshot, up to megabytes), and IndexedDB stores it without a
// JSON round-trip of everything else on every write.
export function openQueueDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(JOBS_STORE_NAME, { keyPath: 'clipId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
