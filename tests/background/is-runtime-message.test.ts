import { isRuntimeMessage } from '../../src/background/is-runtime-message'

test('accepts a message with a string type field', () => {
  expect(isRuntimeMessage({ type: 'clip-captured' })).toBe(true)
})

test('rejects null', () => {
  expect(isRuntimeMessage(null)).toBe(false)
})

test('rejects undefined', () => {
  expect(isRuntimeMessage(undefined)).toBe(false)
})

test('rejects a primitive', () => {
  expect(isRuntimeMessage('clip-captured')).toBe(false)
})

test('rejects an object with no type field', () => {
  expect(isRuntimeMessage({ reason: 'boom' })).toBe(false)
})

test('rejects an object whose type field is not a string', () => {
  expect(isRuntimeMessage({ type: 123 })).toBe(false)
})
