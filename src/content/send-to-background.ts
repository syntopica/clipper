export async function sendToBackground(message: unknown): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message)
  } catch (error) {
    console.error('brain clipper: could not reach the extension background', error)
  }
}
