import { applyTabStatus } from './apply-tab-status'
import { getUserDenylist } from '../shared/get-user-denylist'
import { isInspectableUrl } from './is-inspectable-url'
import { resolveClipStatus } from './resolve-clip-status'

// Paint one tab. Never throws: a tab that closed mid-lookup rejects the
// setIcon call, and an icon that failed to change is not worth a console full
// of errors on every window close.
export async function refreshTabStatus(tabId: number, url: string | undefined): Promise<void> {
  try {
    // An unreadable user denylist names nothing to the service at all.
    const userDenylist = await getUserDenylist()
    if (userDenylist === null || !isInspectableUrl(url, userDenylist)) return
    await applyTabStatus(tabId, await resolveClipStatus(url))
  } catch {
    // The tab went away, or Chrome refused the icon for a page it no longer
    // shows. Either way there is nothing to recover.
  }
}
