import { installChromeMock } from '../chrome-mock'
import { getToken } from '../../src/shared/get-token'
import { setToken } from '../../src/shared/set-token'
import { clearToken } from '../../src/shared/clear-token'
import { hardenTokenStorage } from '../../src/shared/harden-token-storage'

test('the token lives in local storage and never in sync', async () => {
  const stores = installChromeMock()
  await setToken('github_pat_example')

  expect(await getToken()).toBe('github_pat_example')
  expect(JSON.stringify(stores.sync.data)).not.toContain('github_pat_example')
})

test('clearing removes it', async () => {
  installChromeMock()
  await setToken('github_pat_example')
  await clearToken()
  expect(await getToken()).toBeNull()
})

test('hardening restricts local storage to trusted contexts', async () => {
  const stores = installChromeMock()
  await hardenTokenStorage()
  expect(stores.local.accessLevel).toBe('TRUSTED_CONTEXTS')
})
