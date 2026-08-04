import { beginCapture } from './begin-capture'
import { handleCapturedPage } from './handle-captured-page'
import { hardenTokenStorageSafely } from './harden-token-storage-safely'
import { isRuntimeMessage } from './is-runtime-message'
import { refreshTabStatus } from './refresh-tab-status'
import { reportClipToService } from './report-clip-to-service'
import { reportFailure } from './report-failure'
import { setBadge } from './set-badge'

chrome.runtime.onInstalled.addListener(() => void hardenTokenStorageSafely())
chrome.runtime.onStartup.addListener(() => void hardenTokenStorageSafely())

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
  if (message.type === 'clip-failed') {
    reportFailure('capture failed in the page', message.reason)
    return
  }
  if (message.type !== 'clip-captured') return
  void (async () => {
    await setBadge('working')
    try {
      const clip = await handleCapturedPage(message)
      await setBadge('ok')
      // A previous failure may have left an explanatory title behind (see
      // reportFailure); a successful capture clears it back to the manifest
      // default.
      const defaultTitle = chrome.runtime.getManifest().action?.default_title ?? ''
      await chrome.action.setTitle({ title: defaultTitle })
      // The service hears about the clip, and this tab is repainted, so the
      // icon turns amber as the clip lands rather than on the next visit.
      // Neither can fail the capture: it is already committed by here.
      await reportClipToService(message.url, clip.dirPath)
      if (sender.tab?.id !== undefined) await refreshTabStatus(sender.tab.id, message.url)
    } catch (error) {
      reportFailure('clip failed', error)
    }
  })()
})
