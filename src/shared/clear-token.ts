export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove('githubToken')
}
