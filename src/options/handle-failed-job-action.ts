import { deleteJob } from '../background/queue/delete-job'
import { resetFailedJob } from '../background/queue/reset-failed-job'
import type { ResumeQueuePayload } from '../background/resume-queue-payload'
import { renderFailedJobs } from './render-failed-jobs'
import { say } from './say'

// One click on a failed clip's row. Retry puts the job back to `captured` and
// wakes the worker, which runs it like a fresh capture under the same clip id;
// discard deletes it, page payload and all.
export async function handleFailedJobAction(event: Event): Promise<void> {
  const button = (event.target as HTMLElement).closest('button')
  const clipId = button?.closest('li')?.dataset.clipId
  if (!button || clipId === undefined) return
  if (button.dataset.action === 'retry') {
    if (await resetFailedJob(clipId)) {
      await chrome.runtime.sendMessage({ type: 'resume-queue' } satisfies ResumeQueuePayload)
      say('Queued again.')
    }
  } else if (button.dataset.action === 'discard') {
    await deleteJob(clipId)
    say('Discarded.')
  }
  await renderFailedJobs()
}
