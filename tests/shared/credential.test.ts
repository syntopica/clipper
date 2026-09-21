import { installChromeMock } from '../chrome-mock'
import { clearCredential } from '../../src/shared/clear-credential'
import { getCredential } from '../../src/shared/get-credential'
import { hardenTokenStorage } from '../../src/shared/harden-token-storage'
import { setCredential } from '../../src/shared/set-credential'

const credential = {
  accessToken: 'ghu_example',
  refreshToken: 'ghr_example',
  expiresAt: 1_800_000_000_000,
  login: 'an-owner',
}

test('the credential lives in local storage and never in sync', async () => {
  const stores = installChromeMock()
  await setCredential(credential)

  expect(await getCredential()).toEqual(credential)
  expect(JSON.stringify(stores.sync.data)).not.toContain('ghu_example')
  expect(JSON.stringify(stores.sync.data)).not.toContain('ghr_example')
})

test('clearing removes it', async () => {
  installChromeMock()
  await setCredential(credential)
  await clearCredential()
  expect(await getCredential()).toBeNull()
})

test('a malformed stored credential reads as no credential rather than throwing', async () => {
  const stores = installChromeMock()
  stores.local.data.githubCredential = { accessToken: '' }
  expect(await getCredential()).toBeNull()
})

test('hardening restricts local storage to trusted contexts', async () => {
  const stores = installChromeMock()
  await hardenTokenStorage()
  expect(stores.local.accessLevel).toBe('TRUSTED_CONTEXTS')
})
