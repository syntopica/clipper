import { iconPaths } from './icon-paths'
import { RESULT_VISIBLE_MS } from './result-visible-ms'

// Paint the failure on the icon as well as the badge, for as long as the badge
// shows it.
//
// Global rather than per-tab, and deliberately: a failure can arrive with no
// tab to attribute it to - an expired GitHub session reported from the worker,
// a capture whose tab has closed - and the badge is global for the same reason.
// A tab that is painted afterwards takes its own colour back, because a per-tab
// icon overrides the global one.
export function flashErrorIcon(): void {
  void chrome.action.setIcon({ path: iconPaths('error') }).catch(() => undefined)
  setTimeout(() => {
    void chrome.action.setIcon({ path: iconPaths('absent') }).catch(() => undefined)
  }, RESULT_VISIBLE_MS)
}
