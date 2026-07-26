import { build } from 'esbuild'
import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

await build({
  entryPoints: ['src/background/service-worker.ts'],
  outfile: 'dist/background/service-worker.js',
  bundle: true,
  format: 'esm',
  target: 'chrome120',
})

await cp('src/manifest.json', 'dist/manifest.json')
