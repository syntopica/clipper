export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ githubToken: token })
}
