# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-08

- [x] 2026-08-04 - **Integrations:** The toolbar says whether a page is already
  in the clip store, and a repeat clip is a deliberate act rather than an
  accident.
  - The extension had no icon at all (Chrome drew the puzzle piece) and no way
    to know a page was clipped. It now paints one tint per state - grey
    unclipped, amber captured or needs-claude, green ingested, red failed - from
    `GET /api/have` at `clip.cristiandeluxe.dev`, memoised per URL in
    `chrome.storage.session`. Every failure to ask reads as grey, because not
    knowing must not suppress a capture that never happened.
  - `chrome.action.setPopup` is set per tab and only when a clip exists, which
    keeps the one-click capture on every new page. The panel links to the clip
    on GitHub and offers `Capture again`, which mints a new clip id so the
    second capture lands in its own directory.
  - After a clip lands the extension reports it to the service, closing the half
    of the reconciliation that was missing: the desktop lane committed to GitHub
    and the service never heard about it.
  - Two masters for the icon. Below 32px the detailed drawing's folds and wavy
    fissure land on the same three pixels and fill the silhouette back in, so
    the small sizes come from a simplified drawing of the same subject.
  - New permission: `tabs`. Reading the URL of a tab the extension was not
    clicked on requires it, and without it per-tab state is impossible.
  - Evidence: `pnpm typecheck`, `pnpm test` (179 tests) and `pnpm build` green.
    The service side was verified against production in phase 1. Closes "tell
    the user a page is already clipped" and the pending decision on repeat
    clips.
  - Design and plans:
    `~/p/brain/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md`,
    `.../plans/2026-08-04-clip-state-phase-1-service-and-mirror.md`,
    `.../plans/2026-08-04-clip-state-phase-2-extension.md`.

### 2026-07

- [x] 2026-07-27 - **Integrations:** Defuddle replaced `@mozilla/readability` as the
  content extractor, and Phase 5's planned `ExtractionAdapter` interface is dropped
  with it.
  - Readability applied one set of heuristics to every page. Defuddle first looks for
    a site-specific extractor - twenty-seven of them, including X, Reddit, YouTube,
    GitHub, Hacker News, Substack, Wikipedia and the shared-chat pages of ChatGPT,
    Claude, Gemini and Grok - and falls back to heuristics only for everything else.
    That is the adapter layer Phase 5 was going to hand-build, already written and
    maintained upstream; only shadow DOM is left uncovered.
  - Measured before committing to it, against the three clips on disk and the repo
    fixtures: the url-labelled-links fixture goes from 0 links to 4, the real X clip
    from 22 to 49 with none lost, and a live github.com issue selects the `github`
    extractor and yields an author and publish date the metadata collector misses.
  - Then measured on live html through the shipped `buildCapturedPayload` bundle:
    Hacker News, Reddit (nested comment threads with scores and permalinks), GitHub
    and Wikipedia all report `site_extractor: true`; a plain blog correctly reports
    false. The first real browser clip - an X long-form article - produced 28KB of
    markdown, ten headings, seventeen fenced python blocks and no X chrome.
  - Two things went the other way and are recorded in `TODO.md` rather than smoothed
    over: Defuddle drops MDN's "See also" and "Browser compatibility" sections, five
    real content links; and YouTube fetched with curl is a JS shell, so whether that
    extractor works is still unanswered.
  - `extractor_site` was meant to record which extractor matched, and the first real
    clip came back with `"v"`. Defuddle derives that name from `constructor.name` and
    the browser bundles it publishes are minified, so the name never survives - the
    node path reports `github` correctly for exactly that reason. Only presence
    survives, so the field is now the boolean `site_extractor`, and the already
    committed clip was corrected in `brain-clips`.
  - The url-labelled-link recovery stays. Defuddle no longer needs it on X, but it has
    its own scoring: the MDN case proves the failure is still reachable, and the X
    article clip had one link recovered by it.
  - Evidence: `pnpm typecheck`, 135 tests passing, `pnpm build` green on the merge
    commit. Content script grew from 192KB to 1.2MB unminified (229KB gzipped); it is
    injected on click, not declared in the manifest.

- [x] 2026-07-27 - **Bugs:** a clip could silently lose every link in its payload.
  - Found in the first real device-flow clip: an X post titled "[Full GitHub Links]"
    arrived with zero github urls in `index.md`. Each list item read
    `Anthropic official skills repo -` with nothing after the dash.
  - Diagnosis, measured on the committed `source.html` rather than guessed: 53 anchors
    with a github href in the DOM, 0 surviving `extractContent`. Not sanitize, not
    turndown - Readability's link-density cleaning deletes those anchor nodes, text
    included. All 53 of the anchors whose visible text was itself a url were dropped;
    `source.html` kept them because the whole-page snapshot is not extracted.
  - Rejected fixes, both measured: `linkDensityModifier: 1` restores the links but only
    by pushing the thresholds to 1.2/1.5, i.e. disabling the heuristic for every clip;
    the `article` element keeps 106 github mentions but at 115KB against Readability's
    18KB, so the body quality pays for it.
  - Fix: leave extraction alone, recover only the url-labelled anchors it dropped, and
    append them under `## Links removed by the extractor`. An anchor whose text is its
    own url is content by construction, so nav and footer chrome cannot qualify.
  - Evidence: on the real snapshot the clip goes from 0 to 23 github links with the
    extractor still `readability` and the body unchanged (1447 -> 1502 words). The
    regression test uses a 2.1KB fixture reproducing the same shape, and asserts the
    premise too - that Readability really does drop those anchors - so the test cannot
    quietly pass if that behaviour changes. Full suite 134 passing, up from 121.

- [x] 2026-07-27 - **Testing:** the toolbar-click clip closes the loop - a page clipped on
  the user's own Mac, authorized through the device flow, committed to `brain-clips`.
  - Commit `2c77e11`, one parent, exactly four files under
    `clips/pending/2026/07/2026-07-27-x-com-...-01kyggcn/`.
  - `clipped_from` is `mac-arm64-7735`: the generated default from
    `default-machine-name.ts`, on the user's real machine, with a different suffix from
    the `mac-arm64-eb4d` generated during the throwaway-profile run. Per-device
    uniqueness holds, which is the whole point of moving the field out of
    `chrome.storage.sync`.
  - `extractor: readability` (0.6.0), `snapshot_mode: sanitized`, 1447 words,
    `asset_count: 0` - the phase 1 capture path is unaffected by the auth change.
  - The token was necessarily the device-flow one: no PAT path remains in the code and
    the fine-grained PAT was never created.

- [x] 2026-07-27 - **Testing:** device-flow sign-in verified end to end in a real Chrome
  with the production build.
  - Setup: throwaway profile, `dist/` loaded unpacked. `--load-extension` is inert in
    current Chrome unless paired with
    `--disable-features=DisableLoadExtensionCommandLineSwitch`; the CDP
    `Extensions.loadUnpacked` command works regardless and returned
    `odfmlmgmcdlmmclnlagohplgpeijjeoa`, confirming the pinned `manifest.key` still fixes
    the extension id.
  - Options page before sign-in: "Not signed in", machine name prefilled
    `mac-arm64-eb4d`, owner prefilled `BusiRocket` - both new behaviours visible.
  - Sign-in: clicking the button showed user code `CA21-ACD7`, opened
    `github.com/login/device` in a new tab and began polling. Authorizing in a second
    browser (the grant is decoupled from the polling browser) drove the page to "Signed
    in." and "Signed in as @CristianDeluxe" with the code panel hidden.
  - Stored credential: `ghu_` access token, refresh token present, expiry 480 minutes
    out - so "Expire user authorization tokens" really is on and rotation has something
    to rotate with. `chrome.storage.sync` was empty at that point and contained no
    `ghu_`/`ghr_` string.
  - Storage split after Save: `sync` holds exactly `{owner, repo, branch}`, `local` holds
    `githubCredential` and `machineName`. This is the machineName bug fix confirmed
    against real Chrome storage rather than the test mock.
  - Token scope, called from the service worker with the stored token:
    `/repos/BusiRocket/brain-clips` 200, `/repos/BusiRocket/brain-clips/git/ref/heads/main`
    200 (the first call `commitClip` makes), `/user/installations` 200, and
    `/repos/BusiRocket/vault` **404** - a repo in the same org that the signed-in account
    administers. The installation scope holds.
  - Not verified: a capture through the toolbar button. `chrome.scripting.executeScript`
    rides on `activeTab`, which Chrome grants only on a real user gesture, so CDP cannot
    trigger it. Left as the open item in `TODO.md`.

- [x] 2026-07-27 - **Integrations:** the `brain clipper` GitHub App exists and the
  extension carries its client id.
  - Result: app id `4401763`, client id `Iv23liXcjAPOv6uh7NIv`, owned by `@BusiRocket`.
    Permissions are `Contents: read & write` plus the mandatory `Metadata: read` and
    nothing else; webhook off; Device Flow enabled; user-token expiration left on so a
    refresh token is issued. Installed on `BusiRocket/brain-clips` alone - repository id
    `1312787727`, verified against `gh api repos/BusiRocket/brain-clips` before
    installing, since the picker offers ids rather than names.
  - Evidence: `POST https://github.com/login/device/code` with only `client_id` returned
    `user_code`, `verification_uri`, `expires_in: 899` and `interval: 5` - which both
    proves Device Flow is live on the app and matches `DeviceCodeSchema` exactly.
  - Not evidence of a working sign-in: no grant has been completed through the extension
    UI yet. That end-to-end run is the open item in `TODO.md`.
  - Gotcha for anyone editing the app form later: the permission controls and the
    Rails-style checkboxes both render a hidden input sharing the field name, so
    `input[name=...]` selects the hidden mirror and reads a permanently false value.
    Target `input[type=checkbox][name=...]`. A form re-render also invalidates a11y
    snapshot uids, so a stale uid silently clicks the wrong control - re-read state after
    every mutation rather than trusting the last snapshot.

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
    `path: /Users/cristiandeluxe/p/clipper/dist`, id
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
