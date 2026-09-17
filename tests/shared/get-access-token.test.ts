import { installChromeMock } from '../chrome-mock'
import { installConfiguredChromeMock } from '../install-configured-chrome-mock'
import { getAccessToken } from '../../src/shared/get-access-token'

function answerWith(body: unknown): { bodies: string[] } {
  const bodies: string[] = []
  globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ''))
    return new Response(JSON.stringify(body), { status: 200 })
  }) as unknown as typeof fetch
  return { bodies }
}

test('returns null when no one has signed in on this device', async () => {
  installChromeMock()
  expect(await getAccessToken()).toBeNull()
})

test('a credential without an expiry is used as is', async () => {
  const stores = installChromeMock()
  stores.local.data.githubCredential = {
    accessToken: 'ghu_live',
    refreshToken: null,
    expiresAt: null,
    login: null,
  }
  const fetched = answerWith({})

  expect(await getAccessToken()).toBe('ghu_live')
  expect(fetched.bodies).toHaveLength(0)
})

test('an expiring credential is refreshed without a client secret and persisted', async () => {
  const stores = installConfiguredChromeMock()
  stores.local.data.githubCredential = {
    accessToken: 'ghu_old',
    refreshToken: 'ghr_old',
    expiresAt: Date.now() + 30_000,
    login: 'cristiandeluxe',
  }
  const fetched = answerWith({
    access_token: 'ghu_new',
    expires_in: 28800,
    refresh_token: 'ghr_new',
  })

  expect(await getAccessToken()).toBe('ghu_new')
  expect(fetched.bodies[0]).toContain('grant_type=refresh_token')
  expect(fetched.bodies[0]).not.toContain('client_secret')
  expect(stores.local.data.githubCredential).toMatchObject({
    accessToken: 'ghu_new',
    refreshToken: 'ghr_new',
    login: 'cristiandeluxe',
  })
})

test('an expired credential with no refresh token asks for the options page', async () => {
  const stores = installChromeMock()
  stores.local.data.githubCredential = {
    accessToken: 'ghu_old',
    refreshToken: null,
    expiresAt: Date.now() - 1000,
    login: null,
  }

  await expect(getAccessToken()).rejects.toThrow(/open the options page/)
})

test('a rejected refresh asks for the options page instead of failing silently', async () => {
  const stores = installChromeMock()
  stores.local.data.githubCredential = {
    accessToken: 'ghu_old',
    refreshToken: 'ghr_revoked',
    expiresAt: Date.now() - 1000,
    login: null,
  }
  answerWith({ error: 'bad_refresh_token' })

  await expect(getAccessToken()).rejects.toThrow(/open the options page/)
})
