import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { manifestPublicKey } from './scripts/manifest-public-key.mjs'

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
  entryPoints: ['src/options/options.ts', 'src/popup/popup.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  define,
})

await mkdir('dist/options', { recursive: true })
await cp('src/options/options.html', 'dist/options/options.html')
await mkdir('dist/popup', { recursive: true })
await cp('src/popup/popup.html', 'dist/popup/popup.html')

// The capture script carries Defuddle, about 1.2 MB unminified, and is parsed
// on every click. It is the one bundle minified: the rest are small enough
// that readable output in DevTools is worth more than the bytes.
await build({
  entryPoints: ['src/content/capture-page.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'chrome120',
  define,
})

await build({
  entryPoints: ['src/content/x-page-hook.ts', 'src/content/x-collector.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  define,
})

const manifest = JSON.parse(await readFile('src/manifest.json', 'utf8'))
const publicKey = await manifestPublicKey('key.pem')
if (publicKey === null) delete manifest.key
else manifest.key = publicKey
await writeFile('dist/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

// The rasterised icons, one set per state. They are committed rather than
// generated here: `scripts/build-icons.mjs` needs rsvg-convert, and a clone
// should build without it.
await cp('icons', 'dist/icons', {
  recursive: true,
  filter: (path) => !path.endsWith('.svg'),
})
