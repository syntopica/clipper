import { webcrypto } from 'node:crypto'
import { liftSelectorLengthLimit } from './lift-selector-length-limit'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
}

liftSelectorLengthLimit()
