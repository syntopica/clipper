import { defineConfig } from '@playwright/test'

// Real Chromium for what jsdom cannot cover: the manifest loading at all, the
// service worker's IndexedDB queue and alarms, and the options page against
// real `chrome.storage`. Runs against `dist/`, so `pnpm e2e` builds first.
export default defineConfig({
  testDir: '.',
  testMatch: '*.e2e.ts',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
})
