import { installChromeMock } from '../chrome-mock'
import { parseHostnameList } from '../../src/shared/parse-hostname-list'
import { isDenylistedHostname } from '../../src/shared/is-denylisted-hostname'
import { getUserDenylist } from '../../src/shared/get-user-denylist'
import { isInspectableUrl } from '../../src/background/is-inspectable-url'

test('one hostname per line, normalised, blank lines ignored, duplicates folded', () => {
  expect(parseHostnameList('Bank.Example.\n\n  intranet.example \nbank.example')).toEqual({
    ok: true,
    hostnames: ['bank.example', 'intranet.example'],
  })
})

test('a URL, a path or a wildcard is reported, not dropped', () => {
  expect(parseHostnameList('ok.example\nhttps://x.example\n*.y.example\nz.example/path')).toEqual({
    ok: false,
    invalid: ['https://x.example', '*.y.example', 'z.example/path'],
  })
})

test('user entries extend the denylist to the host and its subdomains', () => {
  expect(isDenylistedHostname('portal.bank.example', ['bank.example'])).toBe(true)
  expect(isDenylistedHostname('notbank.example', ['bank.example'])).toBe(false)
})

test('user entries cannot shorten the built-in rules', () => {
  expect(isDenylistedHostname('mail.google.com', [])).toBe(true)
  expect(isDenylistedHostname('localhost', ['example.com'])).toBe(true)
})

test('a user-denylisted host is never named to the capture service', () => {
  expect(isInspectableUrl('https://portal.bank.example/a', ['bank.example'])).toBe(false)
  expect(isInspectableUrl('https://news.example/a', ['bank.example'])).toBe(true)
})

test('the user denylist reads as empty when unset and as null when malformed', async () => {
  const stores = installChromeMock()
  expect(await getUserDenylist()).toEqual([])
  stores.sync.data.denylistedHostnames = ['not a host']
  expect(await getUserDenylist()).toBeNull()
})
