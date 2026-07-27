# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-07

- [-] 2026-07-27 - **Security/Integrations:** the pasted fine-grained PAT is superseded by
  a GitHub App device-flow sign-in, and the machine name stops syncing.
  - Why: pasting a PAT was the whole first-run experience, and it was the one step that
    could not be done from inside the extension. The authorization-code flow needs a
    `client_secret` GitHub will not let a public client skip (no PKCE for OAuth Apps), so
    it would have meant standing up a backend whose only job is holding one secret. The
    device flow needs no secret, and GitHub waives `client_secret` on refresh for tokens
    it issued, so rotation works secretlessly too.
  - Result: options page now offers `Sign in with GitHub` / `Sign out on this device` /
    `Open GitHub to revoke access`. Access token, refresh token and expiry live in
    `chrome.storage.local` as one `githubCredential` record; `getAccessToken` renews 2
    minutes before expiry and persists the renewal. `token-key`, `get-token`, `set-token`,
    `clear-token` and `remove-token` are gone.
  - Bug fixed alongside: `machineName` was in `chrome.storage.sync`, so every device with
    the same Chrome profile reported the same `clipped_from` - the opposite of what the
    field is for. It moved to `chrome.storage.local`, and `setSettings` deletes the stale
    synced copy. A real hostname is unreachable from an extension (`getPlatformInfo` gives
    os/arch only; `enterprise.deviceAttributes` is ChromeOS-with-policy), so the options
    page prefills an editable `os-arch-<random>` default instead.
  - Evidence: `pnpm typecheck` clean, `pnpm test` 121 passed across 29 files (including 7
    new device-flow cases covering `authorization_pending`, `slow_down`, `access_denied`,
    `expired_token` and the no-expiry grant, plus 5 refresh cases asserting no
    `client_secret` is ever sent), `pnpm build` clean.
  - Still blocked: the GitHub App does not exist yet, so `GITHUB_APP_CLIENT_ID` is empty
    and sign-in refuses to start. See the blocked entry in `TODO.md`.

- [x] 2026-07-26 - **Testing:** Phase 1 acceptance run against the real repo and real
  Chrome.
  - Result: 10 of the 12 acceptance items pass. Three real clips were committed to
    `BusiRocket/brain-clips` by the production code path.
  - GitHub half (real API, no browser): four files per commit with exactly one parent;
    `content_sha256` recomputed from the committed `index.md` body matches
    `metadata.json`; a title carrying a colon and double quotes round-trips through a
    real YAML parser; `status` appears only in `state.json`; re-committing the same clip
    returns `alreadyPresent` with a null sha; the same path with a different hash raises
    `ClipConflictError`; a bad token surfaces `existing clip lookup failed: 401` instead
    of being swallowed.
  - Browser half (real Chrome, throwaway profile, production build): the options page
    saves and puts the token in `chrome.storage.local` only, with `sync` holding just the
    four non-secret fields; a selection clip records `extractor: selection`,
    `extractor_version: null` and exactly the selected paragraph; a full-page clip of
    `github.com/mozilla/readability` records `extractor: readability`, 1035 words, zero
    relative links, and no navigation, sign-in or footer text; a broken token leaves the
    reason in the action title; clipping a loopback page is refused with
    `refusing to clip a denylisted host: 127.0.0.1` and commits nothing.
  - **`TRUSTED_CONTEXTS` verified properly:** run inside the content script's isolated
    world, `chrome.storage.local.get(['githubToken'])` throws
    `Access to storage is not allowed from this context.` The checklist's original
    version of this test ran in the page's main world, where `chrome.storage` is never
    exposed regardless of hardening, so it could not have failed.
  - Harness caveats, stated because they matter: injection was triggered by calling
    `chrome.scripting.executeScript` the way `startCapture` does, from a harness that
    granted host permissions, because `activeTab` requires a real user gesture that CDP
    cannot produce. The toolbar click itself and `Cmd+Shift+S` remain unverified. True
    offline behaviour was not tested; the bad-token path stands in for it. The token used
    was the `gh` CLI's classic PAT, in a profile deleted immediately afterwards.

- [x] 2026-07-26 - **Backend:** Phase 1 complete - GitHub layer, atomic commit
  orchestration, browser wiring, docs (tasks 6-9).
  - Result: Git Data API primitives with per-segment branch encoding; `commitClip`
    uploading blobs once and rebuilding tree and commit against a re-read HEAD on a
    non-fast-forward, max 3 attempts; a three-way path-exists rule that never
    overwrites; click and `Cmd+Shift+S` wiring with badge feedback and no silent
    failure path; README plus static verification.
  - Evidence: 105 tests passing, `pnpm typecheck` and `pnpm build` clean, `dist/`
    holding exactly the five expected artifacts with the injected path matching.
  - Commits: `d3f2d97`, `3af48e1`, `b5cb6f3`, `3eb90d4`, `8009e8c`, `50cd925`,
    `543e34e`, `0a028f9`, `37e155d`.

- [x] 2026-07-26 - **Bugs:** Whole-branch review corrections - 1 critical, 8 important.
  - Result: a relative `rel="canonical"` no longer discards the entire capture (it
    failed `z.string().url()` and threw); relative links and images are absolutized on
    every non-Readability branch, where they had been rendering as live links to the
    wrong place; an oversized snapshot is dropped as `snapshot_mode: 'omitted'` instead
    of taking the markdown down with it; failures now carry their reason in the action
    title and open the options page when they are settings or token failures; a hostname
    denylist refuses capture before anything is built; the token storage key has one
    home; the capture payload logic is extracted and tested.
  - Evidence: 61 -> 105 tests. The denylist predicate was independently probed against
    the fifteen hostname forms `URL.hostname` actually produces, including the bracketed
    `[::1]` and trailing-dot FQDN bypasses that the first fix attempt missed.
  - Commits: `c5d3fb8`, `338fc8d`, `48822a0`, `8fd3b0b`, `3c70c04`, `8e33504`,
    `1254b25`, `a2a714d`, `e245ac6`, `c2a9053`.

- [x] 2026-07-26 - **Backend:** Page extraction, clip assembly, and settings/token
  storage (phase 1 tasks 3-5).
  - Result: extraction chain (selection -> Readability -> article -> main -> body ->
    innertext) with DOMPurify sanitizing and Turndown+GFM; clip assembly emitting
    `index.md`, `source.html`, `metadata.json` and `state.json` with YAML frontmatter
    and byte caps that throw; settings in `chrome.storage.sync`, token in
    `chrome.storage.local` behind `setAccessLevel('TRUSTED_CONTEXTS')`, plus the
    options page, its manifest declaration and its build entry point.
  - Evidence: 36 tests passing, `pnpm typecheck` clean, `pnpm build` emitting a
    loadable `dist/`. Each task passed an independent spec+quality review; tasks 3 and
    4 also passed a scoped re-review after fixes.
  - Fixes the reviews forced: `turndown-plugin-gfm` typings that only appeared to work
    under `skipLibCheck`; a `body` branch that made `innertext` unreachable for any
    non-empty document; js-yaml 5's `quotingType` -> `quoteStyle` rename.
  - Commits: `b2c9b09`, `1b9fb19`, `b9e3949`, `1e03fad`.

- [x] 2026-07-26 - **Infrastructure:** Extension loaded unpacked into the daily Chrome
  profile.
  - Result: Registered with `location: 4` (unpacked) and
    `path: /Users/cristiandeluxe/p/brain-clipper/dist`, id
    `odfmlmgmcdlmmclnlagohplgpeijjeoa`.
  - Evidence: entry present in the profile's `Secure Preferences`; the same build had
    already been verified in a throwaway profile via CDP, where its service worker
    target started on install.
  - Note: automation was ruled out first - Chrome ignores `--remote-debugging-port` on
    the default user data directory, so CDP cannot reach the daily profile.

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
