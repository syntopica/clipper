// The tab the panel was opened over. A popup has no tab of its own, so
// everything it shows and everything it does needs this first.
export async function activeTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}
