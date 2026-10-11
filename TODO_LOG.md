# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-10

- [x] 2026-10-11 - **Release:** GitHub release v0.2.0 (tag on 5c846fc) with
  `clipper-store.zip` attached:
  https://github.com/syntopica/clipper/releases/tag/v0.2.0. Evidence: `pnpm
  test` - 350 passed; zip manifest 0.2.0, no `key`.

- [x] 2026-10-11 - **Release prep:** version 0.2.0 in `src/manifest.json` and
  `package.json` (image downloads and the failed-clips list are a feature
  release). `pnpm store:zip` wrote `clipper-store.zip` (926,883 bytes,
  manifest 0.2.0 without `key`, `offscreen` permission included). The GitHub
  release and the store upload stay with the Phase 5 item. Evidence: `pnpm
  test` - 350 passed; `pnpm e2e` - 6 passed.

- [x] 2026-10-11 - **Security:** pre-decode size checks made robust by
  construction after further parser-differential findings (`avif-dimensions.ts`,
  `webp-dimensions.ts`). AVIF is refused outright ("unsupported format") and
  its parser deleted. WebP is accepted only as one still image: simple VP8
  (start code checked, no upscaling bits) or VP8L, or VP8X without the
  animation flag whose chunks are metadata (ICCP, ALPH, EXIF, XMP) plus exactly
  one bitstream with the same size as the canvas; anything else is refused.
  GIF frame areas are summed (cap 200 M pixels) and the canvas is the largest
  frame extent. The post-decode `fitsDecodeCap` backstop stays before any
  canvas. Trade-off documented in README. Evidence: `pnpm test` - 350 passed
  (8 WebP refusals, AVIF refusal, simple and extended still WebP accepted).

- [x] 2026-10-11 - **Testing:** mangled tweet links in X clips (thread clip
  `brain-clips@3e94315`, e.g. `https://x.com/GCRClassic/sta/GCRClassic/status/1621990690304442370…`).
  Cause: X renders a link in tweet text as hidden `https://`, a cut display
  text, the href path hidden after it, and `…`; Defuddle's twitter extractor
  (`formatTweetText`) replaces every anchor with its whole `textContent`, so the
  pieces concatenated. Not the GraphQL stash: these tweets were not patched.
  `prepareXPage` now runs `spellOutXTweetLinks` on every X page, stash or not:
  each non-mention, non-hashtag link in tweet text gets the URL it opens as
  href and as its only text (a t.co link its expanded URL, from the spans less
  the `…`). Evidence: `tests/content/prepare-x-page.test.ts` - that clip's
  anchors through Defuddle yield `https://x.com/GCRClassic/status/1621990690304442370`;
  fails without the fix.

- [x] 2026-10-11 - **Dependencies:** defuddle 0.19.4 -> 0.19.5, which fixes
  the `resource`-into-`src` lazy-image bug upstream (kepano/defuddle#374, PR
  #388); the live-image matching from `3828ff4` stays as defence in depth.
  `extractor_version` follows automatically (`DEFUDDLE_VERSION` is read from
  the installed package by `build.mjs` and `vitest.config.ts`; `dist/` carries
  `"0.19.5"`). `pnpm outdated` lists nothing else. Evidence: `pnpm test` - 340
  passed; `pnpm e2e` - 6 passed.

- [x] 2026-10-11 - **Security:** second review of the pre-decode size check.
  `gif-dimensions.ts` read only the logical screen, but a frame's image
  descriptor can reach past it and decoders grow the canvas; it now walks every
  block, sizes the canvas by the largest frame extent, counts frames (frames x
  area capped at 200 M pixels, `MAX_ANIMATION_PIXELS`), and refuses an unknown
  block or a frameless file. `avif-dimensions.ts` keeps the largest `ispe`
  anywhere (thumbnail, alpha, auxiliary) and now refuses `grid`/`iovl` derived
  images, whose output size lives in item data rather than `ispe`. Backstop:
  `fitsDecodeCap` rejects a decoded bitmap over the cap before any canvas is
  drawn (`reencode-as-webp.ts`) and in the GIF decode check. Evidence: `pnpm
  test` - 340 passed (frame past the screen, 13-frame animation, unknown block,
  thumbnail-first AVIF, grid AVIF, oversized decoded bitmap released).

- [x] 2026-10-11 - **Real-browser checks:** images on - clipping
  https://en.wikipedia.org/wiki/Paper_clip produced
  `CristianDeluxe/brain-clips@77acc1a` with 9 files under `assets/` (8 WebP, 1
  GIF), `asset_count: 9`, `asset_failures: []`, every image referenced as
  `assets/...` (the first attempt, `4f0e3ac`, exposed the Defuddle `resource`
  attribute bug fixed in `3828ff4`). X threads - a 17-tweet thread
  (`3e94315`) and a long note tweet with quote and replies (`9444b56`) came
  out complete with no "Show more" truncation.

- [x] 2026-10-11 - **Cross-repo bookkeeping:** the clips design spec now
  says `full-page` is reserved but never produced, and records that Chrome
  hides manual-redirect targets, so such hops are refused (`syntopica/clips`
  `dfa428f`, `71c911a`).

- [x] 2026-10-11 - **Security:** review of the phase 3 asset code. Fixed:
  (1) `fetch-vetted-asset.ts` read any body whole (`response.blob()`); it now
  streams through `readCappedBody`, refusing past 20 MB by `Content-Length` or
  while counting. (2) `prepare-image-asset.ts`/`reencode-as-webp.ts` decoded
  whatever canvas a header declared (a few KB of PNG can ask for 1.6 GB of
  RGBA); width and height are now read from the PNG/GIF/JPEG/WebP/AVIF header
  and anything over 24 million pixels, or unreadable, or another format, is
  refused before `createImageBitmap`. (3) `keep-svg-attribute.ts` let through
  `url('https://x/a)b')` (a quoted `)` hid the URL from its regex),
  CSS-escaped `u\72l(...)` and `image-set('...')`; every `url(` must now open on
  `#`, backslashes are refused, `image-set(`/`src(`/`@import` too, and the
  `href` check covers any `*:href`. (4) `sanitize-svg.ts` XML-parsed input
  with an internal DTD, open to entity expansion; such input is now refused
  (external DTD references still pass). Evidence: `pnpm test` - 335 passed
  (11 new SVG cases, 3 of which and the DTD case fail on the old code; pixel
  cap per format; streaming cap against an endless body); `pnpm e2e` - 6
  passed.
- [x] 2026-10-11 - **Assets:** Wikipedia images were clipped as their
  `/wiki/File:` pages (clip `brain-clips@4f0e3ac`, failures "does not decode
  as an image"). Cause, reproduced on the live page in Playwright's Chromium:
  Wikipedia's `<img>` carries an RDFa `resource` naming the File: page, and
  Defuddle's lazy-image rule copies any attribute ending in `.jpg` into `src`.
  Extracted images are now matched to the live image by `src` or any `srcset`
  candidate, scheme ignored (protocol-relative `//upload...`), and take what
  the browser displayed. Evidence: `tests/content/image-sources.test.ts`
  (Wikipedia-shaped figure, fails on the old code); the live page now yields
  `thumb.wikimedia.org` URLs, which answer 200 `image/jpeg` directly.

- [x] 2026-10-11 - **Security:** Phase 3 asset pipeline, calling the policy in
  `src/background/assets/`. Images are off by default; the options page's
  "Download images into the clip" checkbox requests `https://*/*` inside its
  click and stores the switch in `chrome.storage.local`. The capture script pins
  one URL per extracted `<img>` (`currentSrc`, `src`, lazy `data-src` and kin,
  largest `srcset`/`<picture>` candidate) before sanitising and sends them as
  `imageUrls`. The worker vets each URL, checks the host permission for its
  origin, fetches without cookies (`opaqueredirect` refused, remote URL kept),
  sniffs the format from the bytes, sanitises SVG in an offscreen document
  (DOMPurify SVG profile, no style/foreignObject, no external references),
  keeps GIFs as-is, re-encodes the rest as WebP q0.82 capped at 1600px on an
  `OffscreenCanvas` (original kept when smaller and unresized), drops anything
  over `MAX_GIT_BLOB_BYTES`, dedupes by URL then sha256, runs 4 at a time (20 s
  deadline each) for at most 30, and stops at a 12 MB per-clip budget. Files commit as
  `assets/NN-<sha8>.<ext>` (base64 blobs), the markdown points at them before
  `content_sha256` is computed, and `asset_count`/`asset_failures` are filled.
  The queue gained `fetching-assets` and `ready`; the prepared assets are
  persisted on the job, so a retry commits the same files. Assets load only
  after the denylist, settings and sign-in checks. New permission: `offscreen`
  (no warning). README, PRIVACY.md and docs/chrome-web-store.md updated.
  Evidence: `pnpm test` - 316 passed (asset pipeline 24 cases, SVG sanitiser,
  image-source choice, queue asset states, base64 blob commit); `pnpm e2e` - 6
  passed, including WebP re-encode on an `OffscreenCanvas` in the extension
  worker and SVG sanitising through the real offscreen document. Not covered
  end to end: the permission prompt cannot be accepted headless (real-browser
  check kept in TODO.md). `fetch-image-asset.ts` is no longer on any path; left
  in place with its tests.

- [x] 2026-10-11 - **Infrastructure:** `permanent-failure` jobs no longer sit
  in the IndexedDB queue with no way out. The options page lists them under
  "Failed clips" (title, capture time, URL, last error) with *Retry* - reset
  to `captured` with the same clip id and a zero attempt count
  (`resetFailedJob`), then a `resume-queue` message wakes the worker - and
  *Discard* (delete). The page writes IndexedDB itself: it shares the
  extension origin with the worker. Evidence: `pnpm test`
  (`tests/options/failed-jobs.test.ts`, 5 cases) and `pnpm e2e` (a seeded
  failed job is listed, retried by the real worker - it fails again with the
  new reason - then discarded, leaving the queue empty).

- [x] 2026-10-11 - **Phase 2 real-browser smoke check:** clipping
  https://github.com/kepano/defuddle/issues/414 from the toolbar produced
  `CristianDeluxe/brain-clips@60ebb1c`. The first attempt failed with "no
  GitHub App client id is configured": the setting made configurable in
  `69200c7` was never filled on this device, so the client id compiled into
  earlier builds (`git log -S` on `src/shared/github-app-client-id.ts`) was
  entered on the options page.

- [x] 2026-10-11 - **Extension reload:** Chrome's Default profile listed
  "brain clipper" in `Secure Preferences` but not on `chrome://extensions`
  (startup load failure from the old placeholder key). After `pnpm build`,
  "Load unpacked" on the dist directory restored it with the same id and its
  stored settings; verified on `chrome://extensions` and in `Secure
  Preferences` (`path` `~/p/clipper/dist`, no disable reasons).

- [!] 2026-10-11 - **Decisions (asset pipeline, kept open in TODO.md):**
  Codex, high: image downloads off by default, enabled by an options-page
  control that requests `https://*/*` once; redirects whose target Chrome
  hides are refused and recorded. Codex, medium: build the pipeline after the
  phase 2 real-browser smoke check.

- [x] 2026-10-11 - **Security:** Phase 3 asset fetch policy and decode
  validation, as modules ahead of the pipeline that will call them
  (`src/background/assets/`). `vetAssetUrl` allows https on port 443 only,
  no URL credentials, and no localhost, `.localhost`, `.local`, 0/8, 127/8,
  RFC 1918, 169.254/16, `::1`, `::`, fe80::/10, fc00::/7 or IPv4-mapped
  private addresses (decimal and hex IPv4 forms are canonicalised by `new
  URL()` first). `fetchVettedAsset` uses `credentials: 'omit'`,
  `redirect: 'manual'`, and vets every `Location` before the next request, up
  to 3 hops. Finding: Chrome returns `opaqueredirect` with no `Location` to a
  manual-redirect fetch in an extension service worker (measured with
  Playwright on 2026-10-11), so per-hop revalidation as the design describes
  is impossible there; such a hop is refused, the asset keeps its remote URL.
  `decodesAsImage`/`fetchImageAsset` keep only bytes `createImageBitmap`
  decodes - a partial mitigation; DNS rebinding to an internal image stays
  accepted residual risk. The private-range checks now live in shared modules
  that the hostname denylist uses too, which also gained 0/8 and IPv4-mapped
  IPv6. Evidence: `pnpm test` (`tests/background/assets/asset-policy.test.ts`,
  29 cases, including a redirect to 169.254.169.254 refused before any
  request to it).
- [x] 2026-10-11 - **Future idea:** `MIN_EXTRACTED_TEXT_LENGTH = 100`
  revisited against real use and kept. In the wiki archive, every clip the
  extension produced since the Defuddle swap (312) reports `extractor:
  defuddle`; none fell through to the DOM-shape chain. The shortest two (16 and
  35 words) are short X posts, correctly extracted. The `article` clips there
  (1,909) come from `clips-harvest`, not from this extension. No clip shows a
  wrong extractor choice, which was Codex's (high) condition for changing it.
  Evidence: a Python pass over `wiki/clips/clips/**/metadata.json` grouping by
  `extractor` and `clipped_from`.
- [-] 2026-10-11 - **Integrations:** Retiring the url-labelled-link recovery
  is rejected on real-use evidence: it fires under Defuddle. Of 312
  Defuddle clips in the wiki archive (`wiki/clips/clips/`), 9 carry
  `## Links removed by the extractor`, recovering 55 links in total (GitHub
  READMEs 8, 13 and 24; X posts 1-2; YouTube 4; a blog 1), the latest on
  2026-09-03. Evidence: `grep -rl "## Links removed by the extractor"
  --include=index.md wiki/clips/clips` (9 files) and the `"extractor":
  "defuddle"` count (312). The recovery stays.
- [x] 2026-10-11 - **Testing:** Playwright against real Chromium for the
  extension lifecycle. Codex decision (medium): local script now, CI job once
  the durable queue ships - it shipped the same day, so both landed. `pnpm e2e`
  builds and side-loads `dist/` into Playwright's Chromium (headless) and
  checks: the manifest loads under the id its key pins; the options page saves
  both hostname lists to real `chrome.storage.sync`; a capture whose blob POST
  answers 503 `Retry-After: 45` is persisted `transient-failure` in the real
  IndexedDB, survives `ServiceWorker.stopAllWorkers`, and is committed exactly
  once (one ref PATCH) when the alarm wakes a fresh worker, leaving the queue
  empty. GitHub is served by `context.route`, which does intercept the service
  worker's requests. CI runs it as the `e2e` job. Evidence: `pnpm e2e` - 3
  passed (1.1m). Not covered: keyboard commands and `OffscreenCanvas` (phase 3).
- [x] 2026-10-11 - **Integrations:** MDN's "See also" and "Browser
  compatibility" losses are accepted. Codex decision (medium): add a
  `developer.mozilla.org` `contentSelector` override only if a fixture shows
  both sections retained without navigation or footer; otherwise keep
  Defuddle's result. Measured on live pages (`Web/API/Window/fetch`,
  `Web/API/Fetch_API/Using_Fetch`) under Defuddle 0.19.4: with
  `contentSelector: '.reference-layout__body'` neither section survives; adding
  `removeExactSelectors/removePartialSelectors: false` brings back
  compatibility but still not "See also", and switches off clutter removal for
  the whole page. Condition not met, so no override. Reopens if a Defuddle
  release keeps those sections or exposes a narrower knob.
- [x] 2026-10-11 - **Future idea:** Non-ASCII titles are transliterated in
  clip directory names. Codex decision (medium): a transliteration dependency
  for new directory names, the Unicode title kept in metadata and frontmatter,
  existing paths untouched. `slugify` runs `any-ascii` (ISC) before its NFKD
  pass: `Москва` -> `moskva`, `日本語のタイトル` -> `ribenyunotaitoru`, accented
  Latin unchanged. Cost: the service worker bundle grows from 869,799 to
  1,425,216 bytes (any-ascii's tables). Evidence: `pnpm test`
  (`tests/shared/slugify.test.ts`).
- [x] 2026-10-11 - **Integrations:** The capture-page bundle is minified.
  Codex decision (medium): minify only `capture-page` (the 1.2 MB Defuddle
  bundle parsed on every click), without `keepNames` - Defuddle's published
  bundle is already mangled, which is why `site_extractor` is a boolean. The
  X hooks stay readable. 1,238,379 -> 814,942 bytes (237,681 gzipped).
  Evidence: the minified and an unminified build of the same entry, run in
  jsdom over `tests/fixtures/blog.html` and `url-labelled-links.html`,
  produce byte-identical `clip-captured` payloads (md5 compared). A real
  browser capture waits on the extension reload parked at the top of TODO.md.
- [x] 2026-10-11 - **Pending decision:** `snapshot_mode` stays `sanitized` by
  default. Codex decision (high): raw `outerHTML` carries tokens, hydration
  data and personal information. Correction to the old entry: `full-page` is
  only a schema value; no UI or code path produces it, so it is not "available
  per clip". The design spec in the clips repository
  (`docs/superpowers/specs/2026-07-26-brain-clipper-design.md`) still says
  otherwise. Not filed there: that checkout has another session's unpushed
  commits and uncommitted edits, so a bookkeeping push from here would publish
  them. Left in TODO.md below for whoever next owns that repository.
- [!] 2026-10-11 - **Security (parked, decided):** OS keychain via native
  messaging stays deferred. Codex decision (high): keep the token in
  `chrome.storage.local` behind `TRUSTED_CONTEXTS`. Reopens when a maintained
  per-machine native-host installer and update path exists, or evidence shows
  the current protection is insufficient. Kept open in TODO.md with that
  condition.

- [x] 2026-10-11 - **Security:** The hostname denylist is user-extendable from
  the options page, and `sensitivity` is classified per clip. Codex decision
  (high): an add-only `denylistedHostnames: string[]` in `chrome.storage.sync`,
  one bare hostname per line, exact-or-subdomain match, applied to capture and
  to capture-service status lookups; built-ins and loopback/private/`.local`
  rules stay mandatory; invalid entries refused on save; an unreadable stored
  list refuses capture and names nothing to the service. Codex decision
  (medium): a separate `privateHostnames: string[]` (same contract) marks
  matching clips `private`; denylist wins; everything else `public`;
  `restricted` waits for an explicit manual-only choice. Configurations saved
  before this load with both lists empty - no migration needed. Evidence:
  `pnpm test` (`tests/shared/hostname-lists.test.ts`,
  `tests/options/save-settings.test.ts`, new cases in
  `handle-captured-page.test.ts` and `settings.test.ts`).
- [x] 2026-10-11 - **Infrastructure:** Phase 2 durable IndexedDB job queue
  (`src/background/queue/`). Jobs are persisted `captured` before any network
  call; each transition (`uploading` under a five-minute lease,
  `transient-failure` with `nextAttemptAt`, `permanent-failure`) is committed
  before the next step; committed jobs are deleted. `alarms` permission added;
  `onStartup`, `onInstalled` and the retry alarm run `resumeQueue()`. Backoff
  honours `Retry-After`, else 30s doubling to 1h, 30 attempts. The lease is
  taken in one readwrite transaction, so concurrent claimers serialise.
  Evidence: `pnpm test` (`tests/background/clip-queue.test.ts`, 11 cases on
  fake-indexeddb: persistence, deletion on commit, transient vs permanent,
  `Retry-After`, lease race, dead-worker resume with the same identity, not-due
  retry, end-to-end `resumeQueue`). Real-browser confirmation waits on the
  extension reload parked at the top of TODO.md (the new `alarms` permission
  needs it anyway).


- [x] 2026-10-11 - **Testing:** Defuddle's site extractors confirmed per site:
  X (real clip), Hacker News, Reddit, GitHub and Wikipedia (shipped bundle
  over live html), YouTube (async transcript path, confirmed in a real
  browser), and a plain blog correctly `site_extractor: false`. The entry had
  stayed `[~]` with every listed site already verified.
- [-] 2026-10-11 - **Infrastructure:** Pin `@types/node` to the Node >= 20
  floor. No such floor exists: the extension runs in Chrome, and Node only
  runs the tooling, where vitest 5 already requires `^22.12 || ^24 || >=26`
  and both CI and the local machine run Node 26. `@types/node` 26 matches
  that, and the owner's standing rule is to take every dependency's latest
  major and fix forward, never pin back.

- [-] 2026-10-11 - **Integrations:** Phase 4 Mac-side ingest CLI and "revisit
  codex synthesis via a stronger boundary" are owned by the clips repository
  (`~/p/clips`), not this extension. That repository shipped the ingest
  pipeline and records, in `docs/sandbox-boundary.md` and
  `boundary-decision.json`, the operator's 2026-07-28 override
  (`CODEX_OPERATOR_OVERRIDE`) that superseded the codex-disabled verdict both
  items were waiting on. Nothing left for the clipper to do.
- [x] 2026-10-11 - **Integrations:** The `processed` clip left under
  `clips/pending/` (`01KYGGCNH0HN292WZ1VQGVR2XW`) has been moved. Evidence: it
  sits at `wiki/clips/clips/processed/2026/07/2026-07-27-x-com-...-01kyggcn/`,
  and the inbox repository is now emptied by `clips pull` on every run (its
  README), so the mover lives in the clips package, not here.
- [x] 2026-10-11 - **Infrastructure:** `clip-metadata-schema.ts`'s three
  `z.string().url()` calls, and the fourth in `device-code-schema.ts`, are now
  `z.url()`, matching the copy in clips' `tools/clips`. Evidence: `grep -rn
  "string().url" src` empty; `pnpm typecheck` and `pnpm test` green.
- [x] 2026-10-11 - **Infrastructure:** Per-tab badge. `setBadge(state, tabId)`
  scopes the badge colour, text and its delayed clear to the capturing tab;
  `reportFailure` takes the tab too and scopes the explanatory title; the
  success path resets only that tab's title. Failures with no tab (token
  hardening, a closed tab) stay global, as does the red icon flash by design
  (`flash-error-icon.ts`). Evidence: `pnpm test`
  (`tests/background/set-badge.test.ts`: tab 1's clear does not touch tab 2's
  result).
- [x] 2026-10-11 - **Infrastructure:** MV3 keepalive around the commit
  sequence. `withKeepalive()` calls `chrome.runtime.getPlatformInfo()` every
  20s while a capture is committed and reported, and clears the interval
  however the work ends. Chrome's lifecycle doc (checked 2026-10-11) says
  events and extension API calls reset the 30s idle timer and does not list
  `fetch`; it also stops a worker whose single `fetch` response takes over
  30s, which a keepalive cannot prevent and the durable queue must absorb.
  Evidence: `pnpm test` (`tests/background/with-keepalive.test.ts`, fake
  timers: three pings in 65s, none after completion or failure). Not yet seen
  in a real browser; needs the extension reload parked at the top of TODO.md.
- [x] 2026-10-11 - **Infrastructure:** Backoff on the blob POSTs. Blobs are now
  created one at a time instead of four concurrently, and each goes through
  `retryTransientGithub()`: transient failures (429, 5xx, rate-limited 403,
  offline) are retried up to four attempts, waiting `Retry-After` when GitHub
  gives it and 1s/2s/4s otherwise; a wait over 30s is not held open in the
  worker, the error surfaces instead (the durable queue is where long waits
  belong). Evidence: `pnpm test`
  (`tests/background/retry-transient-github.test.ts`: max one blob in flight,
  a throttled blob retried after its `Retry-After`).
- [x] 2026-10-11 - **Infrastructure:** Phase 2 - `GithubRequestError` carries
  status and response headers at all seven Git Database call sites (ref and
  commit lookup, blob, tree, commit, ref update, existing-clip lookup), with
  the old messages kept. `githubFailureKind()` separates permanent (401/403,
  404, 422) from transient (429, 5xx, rate-limited 403, offline `TypeError`)
  and `retryAfterMs()` reads `Retry-After` (seconds or HTTP date) or
  `x-ratelimit-reset`. Evidence: `pnpm test`
  (`tests/background/github-request-error.test.ts`, 14 cases).
- [x] 2026-10-11 - **Infrastructure:** Phase 2 prerequisite - `newClipId()`
  and `clippedAt` moved out of `handleCapturedPage` to the enqueue boundary.
  The service worker mints a `ClipJob` (`new-clip-job.ts`) when it accepts a
  `clip-captured` message; `handleCapturedPage` takes the job and never mints
  identity itself. Evidence: `pnpm test` - new test runs one job twice against
  a GitHub mock that remembers commits: same `dirPath`, one ref update, the
  second run stops as `identical`.
- [x] 2026-10-11 - **Build:** `pnpm build` wrote the manifest `key` placeholder
  that the privacy pass left in `src/manifest.json`, which Chrome rejects as an
  invalid key. The build now derives the public key from the gitignored
  `key.pem` (`scripts/manifest-public-key.mjs`) and drops the field when the
  file is absent. Evidence: the id computed from `dist/manifest.json`'s key is
  the one Chrome's Default profile registers for `brain-clipper/dist`.
- [x] 2026-10-11 - **Testing:** 182 tests and no workflow. Added
  `.github/workflows/ci.yml`: one job running `pnpm typecheck`, `pnpm test`
  and `pnpm build` on Node 26, every action pinned by SHA (checkout v7.0.1,
  pnpm/action-setup v6.1.0, setup-node v7.1.0), `packageManager` declared so
  the pnpm action resolves a version. Evidence: `actionlint` clean,
  `pnpm install --frozen-lockfile` and the three commands green locally.

### 2026-08

- [x] 2026-08-04 - **Integrations:** The toolbar says whether a page is already
  in the clip store, and a repeat clip is a deliberate act rather than an
  accident.
  - The extension had no icon at all (Chrome drew the puzzle piece) and no way
    to know a page was clipped. It now paints one tint per state - grey
    unclipped, amber captured or needs-claude, green ingested, red failed - from
    `GET /api/have` at `<capture-service-origin>`, memoised per URL in
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
    the wiki's `docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md`,
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
    committed clip was corrected in the clip repository.
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
  the user's own Mac, authorized through the device flow, committed to the clip repository.
  - Commit `2c77e11`, one parent, exactly four files under
    `clips/pending/2026/07/2026-07-27-x-com-...-01kyggcn/`.
  - `clipped_from` is `mac-arm64-a3f2`: the generated default from
    `default-machine-name.ts`, on the user's real machine, with a different suffix from
    the `mac-arm64-a3f2` generated during the throwaway-profile run. Per-device
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
    `<extension-id>`, confirming the pinned `manifest.key` still fixes
    the extension id.
  - Options page before sign-in: "Not signed in", machine name prefilled
    `mac-arm64-a3f2`, owner prefilled from settings - both new behaviours visible.
  - Sign-in: clicking the button showed user code `CA21-ACD7`, opened
    `github.com/login/device` in a new tab and began polling. Authorizing in a second
    browser (the grant is decoupled from the polling browser) drove the page to "Signed
    in." and "Signed in as the owner account" with the code panel hidden.
  - Stored credential: `ghu_` access token, refresh token present, expiry 480 minutes
    out - so "Expire user authorization tokens" really is on and rotation has something
    to rotate with. `chrome.storage.sync` was empty at that point and contained no
    `ghu_`/`ghr_` string.
  - Storage split after Save: `sync` holds exactly `{owner, repo, branch}`, `local` holds
    `githubCredential` and `machineName`. This is the machineName bug fix confirmed
    against real Chrome storage rather than the test mock.
  - Token scope, called from the service worker with the stored token:
    `/repos/<owner>/<clips-repo>` 200, `/repos/<owner>/<clips-repo>/git/ref/heads/main`
    200 (the first call `commitClip` makes), `/user/installations` 200, and
    `/repos/<owner>/<another-private-repo>` **404** - a repo in the same org that the signed-in account
    administers. The installation scope holds.
  - Not verified: a capture through the toolbar button. `chrome.scripting.executeScript`
    rides on `activeTab`, which Chrome grants only on a real user gesture, so CDP cannot
    trigger it. Left as the open item in `TODO.md`.

- [x] 2026-07-27 - **Integrations:** the `brain clipper` GitHub App exists and the
  extension carries its client id.
  - Result: app id `<app-id>`, client id `<client-id>`, owned by `the owner account`.
    Permissions are `Contents: read & write` plus the mandatory `Metadata: read` and
    nothing else; webhook off; Device Flow enabled; user-token expiration left on so a
    refresh token is issued. Installed on `<owner>/<clips-repo>` alone - repository id
    `<repository-id>`, verified against `gh api repos/<owner>/<clips-repo>` before
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
    `<owner>/<clips-repo>` by the production code path.
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
    `path: <checkout>/dist`, id
    `<extension-id>`.
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
  - Evidence: the wiki's `docs/superpowers/specs/2026-07-26-brain-clipper-design.md`,
    brain commits `b6fb882`, `4c42870`, `c667800`, `db212b8`.

- [x] 2026-07-26 — **Infrastructure:** Bootstrapped the MV3 extension repo.
  - Result: pnpm + TypeScript strict + esbuild + Vitest, manifest with a real
    2048-bit `manifest.key` so the extension id is stable across machines
    (`<extension-id>`), private repos `<owner>/<clipper-repo>`
    and `<owner>/<clips-repo>` created, signing key kept out of git and stored
    in the password manager.
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
  - Evidence: brain commits `0414f02`, `3f02e46`, `580db7d`; the clipper
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
