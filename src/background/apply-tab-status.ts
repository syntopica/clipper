import type { ClipStatus } from '../shared/clip-status'
import { iconPaths } from './icon-paths'

// The popup is set only when a clip already exists. That is what preserves the
// extension's defining property: on a page nothing has captured, the click
// still captures directly, with no panel in the way. On a page that is already
// in the store, the same click opens the panel instead - which is where a
// second capture of the same page is asked for deliberately.
export async function applyTabStatus(tabId: number, status: ClipStatus): Promise<void> {
  await chrome.action.setIcon({ tabId, path: iconPaths(status.state) })
  await chrome.action.setPopup({
    tabId,
    popup: status.state === 'absent' ? '' : 'popup/popup.html',
  })
}
