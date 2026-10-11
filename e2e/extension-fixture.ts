import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test'
import { resolve } from 'node:path'

const EXTENSION_PATH = resolve(import.meta.dirname, '..', 'dist')

// One fresh profile per test, with the built extension side-loaded. Chrome and
// Edge no longer accept the side-loading flags; Playwright's own Chromium does,
// headless included.
export const test = base.extend<{ context: BrowserContext; worker: Worker; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    })
    await use(context)
    await context.close()
  },
  worker: async ({ context }, use) => {
    const [existing] = context.serviceWorkers()
    await use(existing ?? (await context.waitForEvent('serviceworker')))
  },
  extensionId: async ({ worker }, use) => {
    await use(new URL(worker.url()).host)
  },
})

export const expect = test.expect
