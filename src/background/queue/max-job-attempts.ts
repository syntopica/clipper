// After this many attempts a transient failure is treated as permanent: with
// the hour cap on the delay, that is roughly a day of retrying.
export const MAX_JOB_ATTEMPTS = 30
