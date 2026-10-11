import { installChromeMock } from '../chrome-mock'
import { setBadge } from '../../src/background/set-badge'
import { reportFailure } from '../../src/background/report-failure'

afterEach(() => vi.useRealTimers())

test("a tab's result is cleared for that tab alone", async () => {
  installChromeMock()
  vi.useFakeTimers()
  const text = vi.spyOn(chrome.action, 'setBadgeText')

  await setBadge('ok', 1)
  await vi.advanceTimersByTimeAsync(2000)
  await setBadge('error', 2)
  await vi.advanceTimersByTimeAsync(2500)

  expect(text.mock.calls.map(([details]) => details)).toEqual([
    { text: 'ok', tabId: 1 },
    { text: '!', tabId: 2 },
    { text: '', tabId: 1 },
  ])
  await vi.advanceTimersByTimeAsync(2000)
  expect(text.mock.calls.at(-1)?.[0]).toEqual({ text: '', tabId: 2 })
})

test('without a tab the badge stays global', async () => {
  installChromeMock()
  vi.useFakeTimers()
  const text = vi.spyOn(chrome.action, 'setBadgeText')
  await setBadge('error')
  await vi.advanceTimersByTimeAsync(5000)
  expect(text.mock.calls.map(([details]) => details)).toEqual([{ text: '!' }, { text: '' }])
})

test('a failure in a tab is reported on that tab', async () => {
  installChromeMock()
  const text = vi.spyOn(chrome.action, 'setBadgeText')
  const title = vi.spyOn(chrome.action, 'setTitle')
  reportFailure('clip failed', new Error('boom'), 7)
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(text).toHaveBeenCalledWith({ text: '!', tabId: 7 })
  expect(title).toHaveBeenCalledWith({ title: 'boom', tabId: 7 })
})
