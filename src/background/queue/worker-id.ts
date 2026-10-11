// Identifies this service worker instance as a lease owner. A new worker after
// a termination gets a new id, so it cannot mistake a dead worker's lease for
// its own.
export const WORKER_ID = crypto.randomUUID()
