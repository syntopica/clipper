// How long one worker owns a job. Chrome stops any single event that runs
// longer than five minutes, so a lease that outlives that belongs to a worker
// that is gone, and the job is free to be taken again.
export const LEASE_MS = 5 * 60 * 1000
