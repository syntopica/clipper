const TOKEN_KEY = 'githubToken'

export async function getToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get([TOKEN_KEY])
  const token = stored[TOKEN_KEY]
  return typeof token === 'string' && token.length > 0 ? token : null
}
