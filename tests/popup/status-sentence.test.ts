import { describe, expect, it } from 'vitest'
import { capturedSentence } from '../../src/popup/captured-sentence'
import { statusSentence } from '../../src/popup/status-sentence'

describe('statusSentence', () => {
  it('separates the two states the toolbar paints the same amber', () => {
    expect(statusSentence('captured')).not.toBe(statusSentence('needs-claude'))
    expect(statusSentence('needs-claude')).toContain('manual lane')
  })

  it('has a sentence for every state, including the one the panel rarely shows', () => {
    for (const state of ['absent', 'captured', 'ingested', 'needs-claude'] as const) {
      expect(statusSentence(state)).not.toBe('')
    }
  })
})

describe('capturedSentence', () => {
  it('says nothing when the service recorded no date', () => {
    expect(capturedSentence(null)).toBe('')
  })

  it('says nothing rather than "Invalid Date" for a value it cannot parse', () => {
    expect(capturedSentence('Imagen\nhttps://example.com')).toBe('')
  })

  it('renders a real timestamp', () => {
    expect(capturedSentence('2026-07-28T10:12:04+02:00')).toMatch(/^Captured .+\.$/)
  })
})
