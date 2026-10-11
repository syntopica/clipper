import { BADGES } from './badges'
import { RESULT_VISIBLE_MS } from './result-visible-ms'

// With a tab, the badge belongs to that tab alone, so two captures in different
// tabs within RESULT_VISIBLE_MS no longer clear each other's result. Without a
// tab - a failure nothing can be attributed to - it is global.
export async function setBadge(state: keyof typeof BADGES, tabId?: number): Promise<void> {
  const badge = BADGES[state]
  const scope = tabId === undefined ? {} : { tabId }
  await chrome.action.setBadgeBackgroundColor({ color: badge.color, ...scope })
  await chrome.action.setBadgeText({ text: badge.text, ...scope })
  if (state === 'ok' || state === 'error') {
    setTimeout(() => {
      void chrome.action.setBadgeText({ text: '', ...scope }).catch(() => undefined)
    }, RESULT_VISIBLE_MS)
  }
}
