import type { ClipState } from '../shared/clip-state'

// One tint per answer the toolbar can give. `needs-claude` shares amber with
// `captured` on purpose: from the browser both mean "we have it, the wiki does
// not", and splitting them would ask the toolbar to carry a distinction the
// person clicking cannot act on. The panel spells out which one it is.
const TINTS: Record<ClipState | 'error', string> = {
  absent: 'idle',
  captured: 'captured',
  'needs-claude': 'captured',
  ingested: 'ingested',
  error: 'error',
}

export function iconPaths(state: ClipState | 'error'): Record<number, string> {
  const tint = TINTS[state]
  return {
    16: `icons/${tint}-16.png`,
    32: `icons/${tint}-32.png`,
    48: `icons/${tint}-48.png`,
    128: `icons/${tint}-128.png`,
  }
}
