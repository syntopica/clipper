import { pollForCredential } from '../../src/shared/poll-for-credential'
import { requestDeviceCode } from '../../src/shared/request-device-code'

const deviceCode = {
  device_code: 'dc',
  user_code: 'ABCD-1234',
  verification_uri: 'https://github.com/login/device',
  expires_in: 900,
  interval: 0,
}

function answerWith(bodies: unknown[]): { calls: string[] } {
  const calls: string[] = []
  let index = 0
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push(String(init?.body ?? ''))
    void url
    const body = bodies[Math.min(index, bodies.length - 1)]
    index += 1
    return new Response(JSON.stringify(body), { status: 200 })
  }) as unknown as typeof fetch
  return { calls }
}

test('requesting a device code sends only the client id', async () => {
  const fetched = answerWith([deviceCode])

  expect(await requestDeviceCode()).toEqual(deviceCode)
  expect(fetched.calls[0]).toContain('client_id=')
  expect(fetched.calls[0]).not.toContain('client_secret')
})

test('a device code response missing fields is refused with an actionable message', async () => {
  answerWith([{ error: 'device_flow_disabled' }])

  await expect(requestDeviceCode()).rejects.toThrow(/device flow/i)
})

test('polling keeps going while the user has not authorized yet', async () => {
  const fetched = answerWith([
    { error: 'authorization_pending' },
    { error: 'authorization_pending' },
    { access_token: 'ghu_example', expires_in: 28800, refresh_token: 'ghr_example' },
  ])

  const credential = await pollForCredential(deviceCode)

  expect(credential.accessToken).toBe('ghu_example')
  expect(credential.refreshToken).toBe('ghr_example')
  expect(credential.expiresAt).toBeGreaterThan(Date.now())
  expect(fetched.calls).toHaveLength(3)
  expect(fetched.calls.every((body) => !body.includes('client_secret'))).toBe(true)
})

test('a grant without expiry is stored as a credential that never needs refreshing', async () => {
  answerWith([{ access_token: 'ghu_example' }])

  const credential = await pollForCredential(deviceCode)

  expect(credential.expiresAt).toBeNull()
  expect(credential.refreshToken).toBeNull()
})

test('a refusal ends the poll with the reason, not with a timeout', async () => {
  answerWith([{ error: 'access_denied' }])

  await expect(pollForCredential(deviceCode)).rejects.toThrow(/cancelled/i)
})

test('an expired device code ends the poll instead of looping forever', async () => {
  answerWith([{ error: 'expired_token' }])

  await expect(pollForCredential(deviceCode)).rejects.toThrow(/expired/i)
})

test('slow_down raises the interval instead of aborting', async () => {
  const fetched = answerWith([{ error: 'slow_down', interval: 0 }, { access_token: 'ghu_example' }])

  await expect(pollForCredential(deviceCode)).resolves.toMatchObject({ accessToken: 'ghu_example' })
  expect(fetched.calls).toHaveLength(2)
})
