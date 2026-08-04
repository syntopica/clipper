import { BADGES } from './badges'
import { RESULT_VISIBLE_MS } from './result-visible-ms'

export async function setBadge(state: keyof typeof BADGES): Promise<void> {
  const badge = BADGES[state]
  await chrome.action.setBadgeBackgroundColor({ color: badge.color })
  await chrome.action.setBadgeText({ text: badge.text })
  if (state !== 'working') {
    setTimeout(() => void chrome.action.setBadgeText({ text: '' }), RESULT_VISIBLE_MS)
  }
}
