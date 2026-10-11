import type { QueuedClipJob } from './queued-clip-job'

export type JobOutcome =
  | { kind: 'skipped' }
  | { kind: 'committed'; job: QueuedClipJob; dirPath: string }
  | { kind: 'retrying'; job: QueuedClipJob; error: unknown }
  | { kind: 'failed'; job: QueuedClipJob; error: unknown }
