// Capture the page again, deliberately.
//
// A re-capture is not always a mistake - a page that changed between captures
// is worth having twice - so this is allowed rather than blocked. It mints a new
// clip id, so the second capture lands in its own directory and the first is
// untouched. Asking for it here is what makes it deliberate: the toolbar click
// that used to do it silently now opens this panel instead.
export async function requestRecapture(tabId: number): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'clip-again', tabId })
  window.close()
}
