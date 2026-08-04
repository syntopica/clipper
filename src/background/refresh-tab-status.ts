import { applyTabStatus } from './apply-tab-status'
import { isInspectableUrl } from './is-inspectable-url'
import { resolveClipStatus } from './resolve-clip-status'

// Paint one tab. Never throws: a tab that closed mid-lookup rejects the
// setIcon call, and an icon that failed to change is not worth a console full
// of errors on every window close.
export async function refreshTabStatus(tabId: number, url: string | undefined): Promise<void> {
  if (!isInspectableUrl(url)) return
  try {
    await applyTabStatus(tabId, await resolveClipStatus(url))
  } catch {
    // The tab went away, or Chrome refused the icon for a page it no longer
    // shows. Either way there is nothing to recover.
  }
}
