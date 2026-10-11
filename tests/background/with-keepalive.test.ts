import { installChromeMock } from '../chrome-mock'
import { withKeepalive } from '../../src/background/with-keepalive'

afterEach(() => vi.useRealTimers())

test('pings an extension API every 20 seconds while the work runs, and stops after', async () => {
  installChromeMock()
  vi.useFakeTimers()
  const ping = vi.spyOn(chrome.runtime, 'getPlatformInfo')
  let finish: (value: string) => void = () => undefined
  const running = withKeepalive(() => new Promise<string>((resolve) => (finish = resolve)))

  await vi.advanceTimersByTimeAsync(65_000)
  expect(ping).toHaveBeenCalledTimes(3)

  finish('done')
  await expect(running).resolves.toBe('done')
  await vi.advanceTimersByTimeAsync(60_000)
  expect(ping).toHaveBeenCalledTimes(3)
})

test('stops pinging when the work fails', async () => {
  installChromeMock()
  vi.useFakeTimers()
  const ping = vi.spyOn(chrome.runtime, 'getPlatformInfo')
  await expect(withKeepalive(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
  await vi.advanceTimersByTimeAsync(60_000)
  expect(ping).not.toHaveBeenCalled()
})
