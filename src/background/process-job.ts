import { runQueuedJob } from './queue/run-queued-job'
import { settleJobOutcome } from './settle-job-outcome'

export async function processJob(clipId: string): Promise<void> {
  await settleJobOutcome(await runQueuedJob(clipId))
}
