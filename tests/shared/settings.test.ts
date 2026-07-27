import { installChromeMock } from '../chrome-mock'
import { getSettings } from '../../src/shared/get-settings'
import { setSettings } from '../../src/shared/set-settings'

const settings = {
  owner: 'BusiRocket',
  repo: 'brain-clips',
  branch: 'main',
  machineName: 'mac-arm64-a3f2',
}

test('round-trips settings, keeping the machine name out of sync storage', async () => {
  const stores = installChromeMock()
  await setSettings(settings)

  expect(await getSettings()).toEqual(settings)
  expect(stores.sync.data).toEqual({ owner: 'BusiRocket', repo: 'brain-clips', branch: 'main' })
  expect(stores.local.data).toEqual({ machineName: 'mac-arm64-a3f2' })
})

test('drops a machine name left in sync storage by an earlier build', async () => {
  const stores = installChromeMock()
  stores.sync.data.machineName = 'stale'
  await setSettings(settings)

  expect(stores.sync.data.machineName).toBeUndefined()
})

test('returns null when settings are incomplete', async () => {
  installChromeMock()
  expect(await getSettings()).toBeNull()
})

test('returns null when only the machine name is missing', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  expect(await getSettings()).toBeNull()
})
