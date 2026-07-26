import { beginCapture } from './begin-capture'
import type { CaptureFailedPayload } from './capture-failed-payload'
import { handleCapturedPage, type CapturedPagePayload } from './handle-captured-page'
import { hardenTokenStorageSafely } from './harden-token-storage-safely'
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

chrome.runtime.onMessage.addListener((message: CapturedPagePayload | CaptureFailedPayload) => {
  if (message.type === 'clip-failed') {
    reportFailure('capture failed in the page', message.reason)
    return
  }
  if (message.type !== 'clip-captured') return
  void (async () => {
    await setBadge('working')
    try {
      await handleCapturedPage(message)
      await setBadge('ok')
    } catch (error) {
      reportFailure('clip failed', error)
    }
  })()
})
