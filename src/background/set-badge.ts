import { BADGES } from './badges'

export async function setBadge(state: keyof typeof BADGES): Promise<void> {
  const badge = BADGES[state]
  await chrome.action.setBadgeBackgroundColor({ color: badge.color })
  await chrome.action.setBadgeText({ text: badge.text })
  if (state !== 'working') {
    setTimeout(() => void chrome.action.setBadgeText({ text: '' }), 4000)
  }
}
