import { listJobs } from '../background/queue/list-jobs'
import { element } from './element'

// The clips that failed for good: each still holds its whole page in the
// queue, and nothing retries it on its own. Each row carries its clip id and
// two buttons; `handleFailedJobAction` acts on them.
export async function renderFailedJobs(): Promise<void> {
  const failed = (await listJobs())
    .filter((job) => job.state === 'permanent-failure')
    .sort((a, b) => a.clippedAt.localeCompare(b.clippedAt))
  const list = element('failedJobs')
  list.replaceChildren()
  element('failedJobsEmpty').hidden = failed.length > 0
  for (const job of failed) {
    const row = document.createElement('li')
    row.dataset.clipId = job.clipId
    const title = document.createElement('strong')
    title.textContent = job.payload.page.title || job.payload.url
    const detail = document.createElement('div')
    detail.textContent = `${job.clippedAt} - ${job.payload.url}`
    const reason = document.createElement('div')
    reason.textContent = job.lastError ?? 'no reason recorded'
    const retry = document.createElement('button')
    retry.dataset.action = 'retry'
    retry.textContent = 'Retry'
    const discard = document.createElement('button')
    discard.dataset.action = 'discard'
    discard.textContent = 'Discard'
    row.append(title, detail, reason, retry, discard)
    list.append(row)
  }
}
