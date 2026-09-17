import { installChromeMock, type ChromeMock } from './chrome-mock'

// A chrome mock whose sync storage already holds a complete settings record.
// The GitHub App client id and the capture origin are settings, so any code
// path that signs in or talks to the capture service reads them from here.
export function installConfiguredChromeMock(overrides: Record<string, unknown> = {}): ChromeMock {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, {
    owner: 'Owner',
    repo: 'clips',
    branch: 'main',
    githubAppClientId: 'test-client-id',
    captureServiceOrigin: 'https://capture.example.test',
    ...overrides,
  })
  stores.local.data.machineName = 'test-machine'
  return stores
}
