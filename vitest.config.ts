import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    DEFUDDLE_VERSION: JSON.stringify(
      JSON.parse(readFileSync('node_modules/defuddle/package.json', 'utf8')).version,
    ),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
