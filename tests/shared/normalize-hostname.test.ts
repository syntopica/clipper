import { normalizeHostname } from '../../src/shared/normalize-hostname'

test('lowercases', () => {
  expect(normalizeHostname('MAIL.GOOGLE.COM')).toBe('mail.google.com')
})

test('strips a trailing dot (FQDN form)', () => {
  expect(normalizeHostname('mail.google.com.')).toBe('mail.google.com')
})

test('strips IPv6 brackets', () => {
  expect(normalizeHostname('[::1]')).toBe('::1')
  expect(normalizeHostname('[fe80::1]')).toBe('fe80::1')
})

test('is a no-op for an already-plain hostname', () => {
  expect(normalizeHostname('example.com')).toBe('example.com')
})
