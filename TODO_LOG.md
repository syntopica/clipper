# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-07

- [x] 2026-07-26 — **Product:** Design approved for a Chrome extension that clips
  the current page to markdown into a private repo for later brain ingestion.
  - Result: Revision 3 of the design, covering the untrusted-input trust model,
    the clip format, the capture pipeline and the ingest hybrid (codex first,
    Claude for complex or quota-exhausted clips).
  - Evidence: `~/p/brain/docs/superpowers/specs/2026-07-26-brain-clipper-design.md`,
    brain commits `b6fb882`, `4c42870`, `c667800`, `db212b8`.

- [x] 2026-07-26 — **Infrastructure:** Bootstrapped the MV3 extension repo.
  - Result: pnpm + TypeScript strict + esbuild + Vitest, manifest with a real
    2048-bit `manifest.key` so the extension id is stable across machines
    (`odfmlmgmcdlmmclnlagohplgpeijjeoa`), private repos `BusiRocket/brain-clipper`
    and `BusiRocket/brain-clips` created, signing key kept out of git and stored
    in `~/p/vault`.
  - Evidence: `pnpm build` exit 0 emitting `dist/manifest.json` and
    `dist/background/service-worker.js`; `pnpm typecheck` clean; reviewer
    independently re-derived the extension id from the DER key.
  - Files: `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/setup.ts`,
    `build.mjs`, `src/manifest.json`, `src/background/service-worker.ts`.
  - Commits: `429cf1c`, `441e4f1`, `4bb68a4`.

- [x] 2026-07-26 — **Backend:** Clip domain model — ids, slugs, normalization,
  hashing, schemas.
  - Result: `LIMITS`, `newClipId` (ULID), `slugify`, `normalizeMarkdown`,
    `sha256Hex`, `clipDirName`, `clipPath`, and the Zod schemas for clip metadata
    and clip state. `content_sha256` is the hash of the normalized markdown body
    only, so it stays stable across re-processing.
  - Evidence: 10 tests passing, `pnpm typecheck` clean, TDD RED-then-GREEN
    evidence verified as genuine by the task reviewer.
  - Files: `src/shared/*.ts`, `tests/shared/*.test.ts`.
  - Commits: `9c23587`, `6a350bf`.

- [x] 2026-07-26 — **Bugs:** Three defects in the phase 1 plan caught by the
  review loop before they could ship.
  - Result: (1) `build.mjs` bundled entry points that later tasks create, so the
    build could not pass — each task now wires its own entry point. (2) The
    manifest declared `options_page` for a file shipped in Task 5, which makes
    Chrome refuse to load the extension — moved to Task 5. (3) `clipDirName` only
    bounded the title, so a long hostname produced a 221-character directory name
    against a 96-character cap, and an empty title slug left a double separator —
    every variable part is now bounded and the parts are joined non-empty.
  - Evidence: brain commits `0414f02`, `3f02e46`, `580db7d`; brain-clipper
    `441e4f1`, `4bb68a4`, `6a350bf`; tests added for the hostname and empty-title
    cases.

- [-] 2026-07-26 — **Security:** Store the GitHub token in `chrome.storage.sync`
  so a second machine needs no setup.
  - Resolution: Superseded. `local` and `sync` both default to
    `TRUSTED_AND_UNTRUSTED_CONTEXTS`, so a content script could read the token.
    It now lives in `chrome.storage.local` behind
    `setAccessLevel('TRUSTED_CONTEXTS')`, entered once per machine; only
    non-secret config syncs.

- [-] 2026-07-26 — **Product:** One click opens a popup for a note and tags.
  - Resolution: Superseded. `chrome.action.onClicked` does not fire when
    `default_popup` is declared, so the click captures immediately and the note
    flow moved to a context-menu entry.
