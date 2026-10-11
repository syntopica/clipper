import { beginCapture } from './begin-capture'
import { hardenTokenStorageSafely } from './harden-token-storage-safely'
import { isRuntimeMessage } from './is-runtime-message'
import { newClipJob } from './new-clip-job'
import { processJob } from './process-job'
import { enqueueClipJob } from './queue/enqueue-clip-job'
import { RETRY_ALARM_NAME } from './queue/retry-alarm-name'
import { refreshTabStatus } from './refresh-tab-status'
import { reportFailure } from './report-failure'
import { resumeQueueSafely } from './resume-queue-safely'
import { setBadge } from './set-badge'

chrome.runtime.onInstalled.addListener(() => {
  void hardenTokenStorageSafely()
  resumeQueueSafely()
})
chrome.runtime.onStartup.addListener(() => {
  void hardenTokenStorageSafely()
  resumeQueueSafely()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM_NAME) resumeQueueSafely()
})

chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) beginCapture(tab.id)
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'clip-page' && tab?.id !== undefined) beginCapture(tab.id)
})

// The icon describes the URL in the tab - grey unclipped, amber captured and
// waiting, green ingested into the wiki - while the badge keeps describing the
// operation in flight. Two channels drawn on top of each other, which is why
// neither had to give way to the other.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs
    .get(tabId)
    .then((tab) => refreshTabStatus(tabId, tab.url))
    .catch(() => undefined)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // `changeInfo.url` also fires on a same-document navigation, which is how a
  // single-page site moves between articles without ever completing a load.
  if (changeInfo.url === undefined && changeInfo.status !== 'complete') return
  void refreshTabStatus(tabId, changeInfo.url ?? tab.url)
})

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isRuntimeMessage(message)) return
  if (message.type === 'clip-again') {
    // The panel asked for a second capture of a page already in the store. It
    // mints a new clip id, so it lands in its own directory and the existing
    // clip is untouched.
    beginCapture(message.tabId)
    return
  }
  if (message.type === 'resume-queue') {
    resumeQueueSafely()
    return
  }
  if (message.type === 'clip-failed') {
    reportFailure('capture failed in the page', message.reason, sender.tab?.id)
    return
  }
  if (message.type !== 'clip-captured') return
  // The enqueue boundary: the clip's id and timestamp are fixed here, once,
  // and the job is persisted before any network call, so every later attempt
  // - this one, or a retry after the worker died - targets the same directory.
  const job = newClipJob(message)
  const tabId = sender.tab?.id
  void (async () => {
    await setBadge('working', tabId)
    try {
      await enqueueClipJob(job, tabId ?? null)
      await processJob(job.clipId)
    } catch (error) {
      reportFailure('could not queue the clip', error, tabId)
    }
  })()
})
