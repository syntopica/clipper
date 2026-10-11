export const BADGES = {
  working: { text: '...', color: '#888888' },
  ok: { text: 'ok', color: '#2e7d32' },
  error: { text: '!', color: '#c62828' },
  // Waiting for a retry. It stays until the retry settles, like `working`.
  queued: { text: '...', color: '#b45309' },
} as const
