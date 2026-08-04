import { build } from 'esbuild'
import { cp, mkdir, readFile, rm } from 'node:fs/promises'

const define = {
  DEFUDDLE_VERSION: JSON.stringify(
    JSON.parse(await readFile('node_modules/defuddle/package.json', 'utf8')).version,
  ),
}

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

await build({
  entryPoints: ['src/background/service-worker.ts'],
  outfile: 'dist/background/service-worker.js',
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  define,
})

await build({
  entryPoints: ['src/options/options.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  define,
})

await mkdir('dist/options', { recursive: true })
await cp('src/options/options.html', 'dist/options/options.html')

await build({
  entryPoints: [
    'src/content/capture-page.ts',
    'src/content/x-page-hook.ts',
    'src/content/x-collector.ts',
  ],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  define,
})

await cp('src/manifest.json', 'dist/manifest.json')

// The rasterised icons, one set per state. They are committed rather than
// generated here: `scripts/build-icons.mjs` needs rsvg-convert, and a clone
// should build without it.
await cp('icons', 'dist/icons', {
  recursive: true,
  filter: (path) => !path.endsWith('.svg'),
})
