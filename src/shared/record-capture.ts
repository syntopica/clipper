import { CAPTURE_SERVICE_ORIGIN } from './capture-service-origin'

// Record a URL with the capture service and get back the id of the row that
// holds it. Idempotent on the normalized URL: a URL already there returns its
// existing id rather than a second row, which is what makes this safe to call
// after every clip, including a deliberate re-capture of the same page.
export async function recordCapture(token: string, url: string): Promise<string> {
  const response = await fetch(`${CAPTURE_SERVICE_ORIGIN}/api/capture`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      url,
      capture_source: 'chrome-extension',
      captured_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) throw new Error(`recording the capture returned ${response.status}`)
  const body = (await response.json()) as { data?: { capture_id?: string } }
  const captureId = body.data?.capture_id
  if (captureId === undefined) throw new Error('the service returned no capture id')
  return captureId
}
