import type { ClipState } from '../shared/clip-state'

// What the panel says the state is. `needs-claude` gets its own sentence even
// though it shares the toolbar's amber: the icon cannot carry a distinction the
// person clicking cannot act on, but the panel is where they can act on it.
const SENTENCES: Record<ClipState, string> = {
  absent: 'Not captured yet.',
  captured: 'Captured, waiting to be ingested into the brain.',
  'needs-claude': 'Captured, and routed to the manual lane.',
  ingested: 'Ingested into the brain.',
}

export function statusSentence(state: ClipState): string {
  return SENTENCES[state]
}
