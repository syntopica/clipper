import { execFileSync } from 'node:child_process'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'

// Package `dist/` for the Chrome Web Store. The store signs the upload with its
// own key and refuses a manifest that carries one, so the `key` the build
// derives from `key.pem` for unpacked installs is removed from this copy only.
// The store build therefore has a different extension id from an unpacked
// install, and its settings and GitHub sign-in are entered again.
await rm('store', { recursive: true, force: true })
await rm('clipper-store.zip', { force: true })
await cp('dist', 'store', { recursive: true })

const manifest = JSON.parse(await readFile('store/manifest.json', 'utf8'))
delete manifest.key
await writeFile('store/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

execFileSync('zip', ['-qr', '../clipper-store.zip', '.'], { cwd: 'store', stdio: 'inherit' })
await rm('store', { recursive: true, force: true })
