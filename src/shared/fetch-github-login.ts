// Only used to label the options page with the account that authorized. A failure
// here must never fail the sign-in, so callers treat null as "unknown account".
export async function fetchGithubLogin(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${accessToken}`,
        'x-github-api-version': '2022-11-28',
      },
    })
    if (!response.ok) return null
    const body: unknown = await response.json()
    const login = (body as { login?: unknown }).login
    return typeof login === 'string' && login.length > 0 ? login : null
  } catch {
    return null
  }
}
