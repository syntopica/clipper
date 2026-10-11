import type { JobOutcome } from './queue/job-outcome'
import { refreshTabStatus } from './refresh-tab-status'
import { reportClipToService } from './report-clip-to-service'
import { reportFailure } from './report-failure'
import { setBadge } from './set-badge'

// What the toolbar and the capture service hear about one attempt. Never
// throws: the job's state is already persisted by the time this runs.
export async function settleJobOutcome(outcome: JobOutcome): Promise<void> {
  if (outcome.kind === 'skipped') return
  const tabId = outcome.job.tabId ?? undefined
  const scope = tabId === undefined ? {} : { tabId }
  try {
    if (outcome.kind === 'failed') {
      reportFailure('clip failed', outcome.error, tabId)
      return
    }
    if (outcome.kind === 'retrying') {
      await setBadge('queued', tabId)
      const reason = outcome.error instanceof Error ? outcome.error.message : String(outcome.error)
      await chrome.action.setTitle({ title: `queued, will retry: ${reason}`, ...scope })
      return
    }
    await setBadge('ok', tabId)
    // A previous failure may have left an explanatory title behind (see
    // reportFailure); a successful capture clears it back to the manifest
    // default.
    const defaultTitle = chrome.runtime.getManifest().action?.default_title ?? ''
    await chrome.action.setTitle({ title: defaultTitle, ...scope })
    // The service hears about the clip, and the tab is repainted, so the icon
    // turns amber as the clip lands rather than on the next visit. Neither can
    // fail the capture: it is already committed by here.
    await reportClipToService(outcome.job.payload.url, outcome.dirPath)
    if (tabId !== undefined) await refreshTabStatus(tabId, outcome.job.payload.url)
  } catch (error) {
    console.error('brain clipper: could not report a clip outcome', error)
  }
}
