import { installChromeMock } from '../chrome-mock'
import { reportFailure } from '../../src/background/report-failure'

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

test('sets the action title to the failure reason so a hover explains it', async () => {
  const mock = installChromeMock()
  reportFailure('clip failed', new Error('boom'))
  await flush()
  expect(mock.actionTitles).toContain('boom')
})

test('opens the options page on a settings-or-token failure', async () => {
  const mock = installChromeMock()
  reportFailure('clip failed', new Error('no GitHub token on this device - open the options page'))
  await flush()
  expect(mock.openOptionsPageCalls).toHaveLength(1)
})

test('does not open the options page for an unrelated failure', async () => {
  const mock = installChromeMock()
  reportFailure('clip failed', new Error('network error'))
  await flush()
  expect(mock.openOptionsPageCalls).toHaveLength(0)
})
