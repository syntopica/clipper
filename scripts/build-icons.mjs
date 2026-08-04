// Rasterise the master icon into the four state tints Chrome needs.
//
// A build step with committed output rather than something the service worker
// does at runtime: a worker cannot rasterise SVG reliably, and
// `chrome.action.setIcon` takes a path per tab, which is all this needs.
//
// Requires `rsvg-convert` (homebrew: librsvg). It is not a dependency of the
// extension - the PNGs it produces are committed, so a clone builds without it.
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const run = promisify(execFile)

const TINTS = {
  idle: '#6b7280',
  captured: '#b45309',
  ingested: '#2e7d32',
  error: '#c62828',
}

// Two masters, not one. Below 32px the detailed drawing's folds and wavy
// fissure land on the same two or three pixels and fill the silhouette back in,
// so the small sizes come from a simplified drawing of the same subject. This is
// the same reason a favicon is not just a shrunk logo.
const MASTERS = {
  16: 'icons/brain-clip-small.svg',
  32: 'icons/brain-clip-small.svg',
  48: 'icons/brain-clip.svg',
  128: 'icons/brain-clip.svg',
}

const sources = Object.fromEntries(
  await Promise.all(
    [...new Set(Object.values(MASTERS))].map(async (path) => [
      path,
      await readFile(path, 'utf8'),
    ]),
  ),
)

for (const [state, tint] of Object.entries(TINTS)) {
  for (const [size, master] of Object.entries(MASTERS)) {
    const tinted = `icons/.tinted-${state}-${size}.svg`
    await writeFile(tinted, sources[master].replaceAll('TINT', tint))
    await run('rsvg-convert', [
      tinted,
      '-w',
      size,
      '-h',
      size,
      '-o',
      `icons/${state}-${size}.png`,
    ])
    await run('rm', [tinted])
  }
}

console.log(
  `wrote ${Object.keys(TINTS).length * Object.keys(MASTERS).length} icons for ${Object.keys(TINTS).join(', ')}`,
)
