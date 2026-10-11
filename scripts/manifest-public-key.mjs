import { createPublicKey } from 'node:crypto'
import { readFile } from 'node:fs/promises'

// The manifest `key` is the base64 DER SubjectPublicKeyInfo of the signing key.
// The committed manifest carries a placeholder, because the key identifies the
// owner's install; the real value is derived here from the gitignored
// `key.pem`. Without that file the build returns null and the field is dropped,
// since Chrome refuses to load a manifest whose `key` is not valid base64 DER.
export async function manifestPublicKey(pemPath) {
  let pem
  try {
    pem = await readFile(pemPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  return createPublicKey(pem).export({ type: 'spki', format: 'der' }).toString('base64')
}
