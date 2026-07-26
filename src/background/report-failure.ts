import { setBadge } from './set-badge'

// Both `handleCapturedPage` errors that require a fix in the options page
// ("settings are incomplete - open the options page" and "no GitHub token on
// this device - open the options page") end with this phrase deliberately -
// it doubles as the marker this module uses to decide whether to open the
// options page automatically.
const OPEN_OPTIONS_PAGE_MARKER = 'open the options page'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function reportFailure(context: string, error: unknown): void {
  const reason = errorMessage(error)
  console.error(`brain clipper: ${context}`, error)

  void setBadge('error').catch((badgeError) => {
    console.error('brain clipper: could not set the error badge', badgeError)
  })

  void chrome.action.setTitle({ title: reason }).catch((titleError) => {
    console.error('brain clipper: could not set the action title', titleError)
  })

  if (reason.toLowerCase().includes(OPEN_OPTIONS_PAGE_MARKER)) {
    void chrome.runtime.openOptionsPage().catch((optionsError) => {
      console.error('brain clipper: could not open the options page', optionsError)
    })
  }
}
