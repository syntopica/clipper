import { isDenylistedHostname } from '../../src/shared/is-denylisted-hostname'
import { DENYLISTED_HOSTNAMES } from '../../src/shared/denylisted-hostnames'

test('refuses an exact match from the starting list', () => {
  const hostname = DENYLISTED_HOSTNAMES[0]
  expect(hostname).toBeDefined()
  expect(isDenylistedHostname(hostname as string)).toBe(true)
})

test('refuses a subdomain of a denylisted hostname', () => {
  const hostname = DENYLISTED_HOSTNAMES[0]
  expect(isDenylistedHostname(`mail.${hostname}`)).toBe(true)
})

test('refuses localhost and loopback addresses', () => {
  expect(isDenylistedHostname('localhost')).toBe(true)
  expect(isDenylistedHostname('127.0.0.1')).toBe(true)
  expect(isDenylistedHostname('::1')).toBe(true)
})

test('refuses .local hostnames', () => {
  expect(isDenylistedHostname('my-nas.local')).toBe(true)
})

test('refuses private IPv4 literals', () => {
  expect(isDenylistedHostname('10.0.0.5')).toBe(true)
  expect(isDenylistedHostname('172.16.0.1')).toBe(true)
  expect(isDenylistedHostname('192.168.1.1')).toBe(true)
  expect(isDenylistedHostname('169.254.1.1')).toBe(true)
})

test('allows a normal public site', () => {
  expect(isDenylistedHostname('example.com')).toBe(false)
  expect(isDenylistedHostname('simonwillison.net')).toBe(false)
})

test('does not mistake an unrelated hostname that merely ends with a denylisted one for a match', () => {
  const hostname = DENYLISTED_HOSTNAMES[0] as string
  expect(isDenylistedHostname(`evil-${hostname}`)).toBe(false)
})

test('refuses the trailing-dot FQDN form of a denylisted hostname', () => {
  const hostname = DENYLISTED_HOSTNAMES[0] as string
  expect(isDenylistedHostname(`${hostname}.`)).toBe(true)
})

test('refuses the bracketed IPv6 loopback form new URL(...).hostname actually returns', () => {
  expect(isDenylistedHostname('[::1]')).toBe(true)
  expect(isDenylistedHostname('::1')).toBe(true)
})

test('refuses bracketed IPv6 link-local and unique-local literals', () => {
  expect(isDenylistedHostname('[fe80::1]')).toBe(true)
  expect(isDenylistedHostname('[fd12:3456::1]')).toBe(true)
})

test('is case-insensitive on a denylisted hostname', () => {
  const hostname = (DENYLISTED_HOSTNAMES[0] as string).toUpperCase()
  expect(isDenylistedHostname(hostname)).toBe(true)
})
