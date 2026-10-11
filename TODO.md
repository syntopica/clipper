# TODO

> Consolidated from the accessible Claude, Codex, and Antigravity project
> history. Last reviewed: 2026-07-26. History coverage: Partial.
>
> States: `[ ]` pending · `[~]` partial or unverified · `[!]` blocked ·
> `[x]` verified complete · `[-]` obsolete or superseded. Closed work moves to
> `TODO_LOG.md`.

The only history source is the live Claude Code session that created this
project on 2026-07-26; it is still open, so its transcript is indexed as
`partial` rather than `complete`. No Codex session mentions this project and no
Antigravity store exists on this machine.

Design: the wiki's `docs/superpowers/specs/2026-07-26-brain-clipper-design.md`
Phase 1 plan: the wiki's `docs/superpowers/plans/2026-07-26-brain-clipper-phase-1.md`

## Blocked Tasks

## Testing

- [ ] Real-browser check of image downloads (phase 3). Unit tests and
  `pnpm e2e` cover the pipeline in pieces, but no end-to-end clip with images
  has run: the `https://*/*` prompt cannot be accepted in headless Playwright.
  Smallest step: reload the extension (it now also asks for `offscreen`, which
  shows no warning), tick "Download images into the clip" on the options page
  and accept Chrome's prompt, clip a page with a few raster images, an SVG and a
  lazy-loaded image (a Wikipedia article works), then check the commit has
  `assets/01-<sha8>.webp` and friends, `index.md` points at them, and
  `asset_count`/`asset_failures` add up.
- [~] Verify the X thread repair on a real multi-thread clip. One captured X thread (clip 01KYN4S3) captured 4 tweets truncated behind "Show more" and
  one thread tweet missing from the virtualized DOM; the GraphQL-stash repair
  (x-page-hook / x-collector / prepare-x-page) fixes that in unit tests but has
  not yet seen a real capture. Reload the extension and the x.com tab first —
  the collector only stashes responses from pages loaded after install.
  Checked 2026-10-11 against the wiki archive: the 26 extension x.com clips
  since the repair (2026-07-29) contain no "Show more" truncation, but all are
  single posts or X Articles - none is a multi-tweet thread, so the repair is
  still unseen on a real thread. Needs a logged-in x.com tab: reload the
  extension (item above), reload a thread page, clip it, and check every
  thread tweet is present and untruncated.

- [!] Logged-out x.com is a different app the clipper cannot read: guest status
  pages are server-rendered by a Relay/TanStack app with none of the logged-in
  DOM (`cellInnerDiv`, `tweetText`, `User-Name` testids absent; articles carry
  `data-tweet-id` + Tailwind classes), they fire no GraphQL requests (so
  x-page-hook relays nothing), and Defuddle's twitter extractor finds no main
  tweet. The full data - complete note_tweet text, whole X Article draft-js
  blocks - sits hydrated in the page's Relay store, reachable from any
  article's React fiber (env with `getStore()`; records `TweetResults:<id>`,
  text under `result.details.full_text`, user under
  `core.user_results.result.core`). The 2026-07-29 clip rescue proved this
  path end to end (clip repository, commit ef86110); decide whether the extension grows a
  guest-page fallback that mines the store the same way.
  Decided 2026-10-11 (Codex, high): keep deferred - React fiber and Relay
  store internals are a brittle dependency for a mode the owner rarely uses.
  Unblocks after repeated real guest-page captures fail; use those captures to
  define the required content.

## Backend

## Integrations

- [!] Upstream: `extractorType` is unusable in Defuddle's published
  browser bundles: it comes from `constructor.name`, and `dist/index.js` and
  `dist/index.full.js` are minified, so it arrives as `v` or `a`. The unbundled
  CJS under `dist/` keeps the names, which is why the node path reports `github`
  correctly and the extension cannot. `site_extractor` is a boolean because of
  this; restore the name if upstream sets `keep_classnames`.
  Re-checked 2026-10-11 on defuddle 0.19.4: `dist/index.full.js` still sets
  `extractorType: o.constructor.name.replace("Extractor", ...)` over classes
  minified to `class a extends`. Reported upstream 2026-10-11 as
  https://github.com/kepano/defuddle/issues/414 ; waiting on a fix there.

## Security

- [!] Move the GitHub token out of `chrome.storage.local` into the OS keychain via
  native messaging. Deferred by design; the token is currently a persisted secret
  with no keychain protection. Decided 2026-10-11 (Codex, high): stay deferred.
  Unblocks when a maintained per-machine native-host installer and update path
  exists, or evidence shows `TRUSTED_CONTEXTS` local storage is insufficient
  for this owner's threat model.

## Infrastructure

- [!] Phase 5 - publish unlisted to the Chrome Web Store and ship `dist.zip`
  through GitHub Releases, replacing per-machine unpacked loads. Parked
  2026-10-11: publishing is an external release the owner performs. Steps:
  `pnpm build && (cd dist && zip -r ../dist.zip .)`; `gh release create
  v0.1.0 dist.zip --repo syntopica/clipper --title v0.1.0 --notes "..."`; for
  the store, the developer dashboard upload of `dist.zip` (the store re-signs,
  so the `key` field must be removed from the uploaded manifest and the store
  id differs from the unpacked id - settings would need re-entry).

## Testing

## Pending Decisions

- [!] Cross-repo bookkeeping: the clips repository's
  `docs/superpowers/specs/2026-07-26-brain-clipper-design.md` says
  `snapshot_mode: full-page` "remains available per clip"; no UI or code path
  produces it. Not filed in that repository on 2026-10-11 because its checkout
  held another session's unpushed commits. Smallest step: when `~/p/clips` is
  clean and in sync, add a TODO there to correct the sentence, and a second
  one: the same spec's asset policy says `redirect: 'manual'` with per-hop
  `Location` revalidation, which Chrome makes impossible (an extension
  worker's manual-redirect fetch is `opaqueredirect`, no `Location`).

## Future Ideas

- [ ] Migrate images to Cloudflare R2 if the clips repo approaches ~1 GB. Note
  the real cost: rewriting asset paths does not shrink history, so reclaiming
  space needs `git filter-repo`, a force-push and a re-clone everywhere.
  Checked 2026-10-11: the inbox repository reports 413 MB (`gh api
  repos/<owner>/<clips-repo> --jq .size`), all history, since `clips pull`
  empties it on every run; the archive moved to the wiki. No images are
  clipped yet (phase 3), so the trigger is still far off.
