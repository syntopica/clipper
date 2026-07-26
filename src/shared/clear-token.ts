import { TOKEN_KEY } from './token-key'

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY)
}
