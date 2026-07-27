// GitHub's OAuth endpoints answer in form-urlencoded unless asked otherwise, so
// every caller sets `accept: application/json` and reads JSON back.
export async function postOauthForm(url: string, fields: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  })
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status} at ${url}`)
  }
  return response.json()
}
