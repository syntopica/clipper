import { installChromeMock } from '../chrome-mock'
import { defaultMachineName } from '../../src/shared/default-machine-name'

test('describes the platform and stays unique per device', async () => {
  installChromeMock()

  const name = await defaultMachineName()
  expect(name).toMatch(/^mac-arm64-[0-9a-f]{4}$/)
  expect(await defaultMachineName()).not.toBe(name)
})
