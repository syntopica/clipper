import { installChromeMock } from '../chrome-mock'
import { getSettings } from '../../src/shared/get-settings'
import { setSettings } from '../../src/shared/set-settings'

test('round-trips settings through sync storage', async () => {
  const stores = installChromeMock()
  await setSettings({ owner: 'BusiRocket', repo: 'brain-clips', branch: 'main', machineName: 'mac-cristian' })

  expect(await getSettings()).toEqual({
    owner: 'BusiRocket',
    repo: 'brain-clips',
    branch: 'main',
    machineName: 'mac-cristian',
  })
  expect(stores.local.data).toEqual({})
})

test('returns null when settings are incomplete', async () => {
  installChromeMock()
  expect(await getSettings()).toBeNull()
})
