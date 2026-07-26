import { sha256Hex } from '../../src/shared/sha256-hex'

test('matches the known digest of "abc"', async () => {
  await expect(sha256Hex('abc')).resolves.toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})
