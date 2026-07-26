const inFlight = new Set<number>()

export async function startCapture(tabId: number): Promise<void> {
  if (inFlight.has(tabId)) return
  inFlight.add(tabId)
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/capture-page.js'] })
  } finally {
    setTimeout(() => inFlight.delete(tabId), 5000)
  }
}
