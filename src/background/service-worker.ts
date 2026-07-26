import { hardenTokenStorage } from '../shared/harden-token-storage'
import { handleCapturedPage, type CapturedPagePayload } from './handle-captured-page'
import { setBadge } from './set-badge'
import { startCapture } from './start-capture'

chrome.runtime.onInstalled.addListener(() => void hardenTokenStorage())
chrome.runtime.onStartup.addListener(() => void hardenTokenStorage())

chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) void startCapture(tab.id)
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'clip-page' && tab?.id !== undefined) void startCapture(tab.id)
})

chrome.runtime.onMessage.addListener((message: CapturedPagePayload) => {
  if (message.type !== 'clip-captured') return
  void (async () => {
    await setBadge('working')
    try {
      await handleCapturedPage(message)
      await setBadge('ok')
    } catch (error) {
      console.error('clip failed', error)
      await setBadge('error')
    }
  })()
})
