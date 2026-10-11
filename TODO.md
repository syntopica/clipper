# TODO

- [!] Reload the unpacked extension from `<checkout>/dist` in Chrome's Default profile, keeping extension `<extension-id>` and its stored configuration. The 2026-09-14 directory migration found Chrome still registered to the old `brain-clipper/dist` path; a compatibility symlink preserves it. The browser connector was unavailable. Once the new path is confirmed in Chrome, remove only the compatibility symlink.

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

- [~] Verify the X thread repair on a real multi-thread clip. One captured X thread (clip 01KYN4S3) captured 4 tweets truncated behind "Show more" and
  one thread tweet missing from the virtualized DOM; the GraphQL-stash repair
  (x-page-hook / x-collector / prepare-x-page) fixes that in unit tests but has
  not yet seen a real capture. Reload the extension and the x.com tab first —
  the collector only stashes responses from pages loaded after install.

- [ ] Logged-out x.com is a different app the clipper cannot read: guest status
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

## Backend

## Integrations

- [ ] Report upstream that `extractorType` is unusable in Defuddle's published
  browser bundles: it comes from `constructor.name`, and `dist/index.js` and
  `dist/index.full.js` are minified, so it arrives as `v` or `a`. The unbundled
  CJS under `dist/` keeps the names, which is why the node path reports `github`
  correctly and the extension cannot. `site_extractor` is a boolean because of
  this; restore the name if upstream sets `keep_classnames`.
- [ ] Defuddle drops MDN's "See also" and "Browser compatibility" sections, which
  Readability kept - five real content links lost on the one MDN clip on disk.
  Decide whether that is acceptable or worth a `contentSelector` override for
  `developer.mozilla.org`.
- [ ] Retire the url-labelled-link recovery (`dropped-content-links.ts`,
  `append-dropped-links.ts`, `is-url-like-text.ts`, `LIMITS.MAX_RECOVERED_LINKS`)
  if it never fires again. It was written for a Readability behaviour Defuddle does
  not share, and it is kept only as a net for the same failure elsewhere - which
  the MDN item above shows is not hypothetical. Needs real-use evidence, not a
  decision now.
- [ ] The content script bundle went from 192 KB to 1.2 MB unminified (775 KB
  minified, 229 KB gzipped) with Defuddle. It is injected on click rather than
  declared in the manifest, so nothing pays for it while browsing, but the build
  does not minify at all today - turning that on is the cheap fix if it matters.

## Security

- [ ] Make the hostname denylist user-editable from the options page. It is a
  conservative constant today (`src/shared/denylisted-hostnames.ts`) and the user is
  expected to extend it; a constant means editing code to do that.
- [ ] `sensitivity` is hardcoded `public`. Honest in phase 1 only because a denylisted
  host is refused outright, but phase 4's routing keys on this field, so per-clip
  classification has to exist before that ships.
- [ ] Phase 3 - asset fetch policy before any image download: https-only, port
  443, no URL credentials, block loopback / private / link-local / `.local`,
  `redirect: 'manual'` with per-hop revalidation, `credentials: 'omit'` first.
  Not optional - without it the extension is an SSRF proxy for any page it clips.
- [ ] Phase 3 - keep only assets that decode via `createImageBitmap`. Documented
  as a partial mitigation: DNS rebinding to a private service that returns a real
  image remains residual accepted risk.
- [ ] Move the GitHub token out of `chrome.storage.local` into the OS keychain via
  native messaging. Deferred by design; the token is currently a persisted secret
  with no keychain protection.

## Infrastructure

- [ ] Phase 5 - publish unlisted to the Chrome Web Store and ship `dist.zip`
  through GitHub Releases, replacing per-machine unpacked loads.

## Testing

- [ ] Phase 2 - Playwright against real Chromium for the extension lifecycle
  (permissions, commands, `OffscreenCanvas`, service worker termination and
  resume). jsdom cannot cover any of it.

## Pending Decisions

- [ ] Decide whether `snapshot_mode` stays `sanitized` by default. The design was
  approved with a raw full-page archive, then narrowed to a sanitized snapshot
  because `outerHTML` carries CSRF tokens, hydration JSON and personal data;
  `full-page` remains available per clip. One line changes it back.

## Future Ideas

- [ ] Transliterate non-ASCII titles. `slugify('日本語のタイトル')` is empty, so every
  CJK, Cyrillic or Greek page gets a directory of date, host and id with no readable
  hint.
- [ ] Revisit `MIN_EXTRACTED_TEXT_LENGTH = 100` after real use. It is fixture-fitted,
  and it is the single knob deciding `defuddle` versus the DOM-shape chain.
- [ ] Migrate images to Cloudflare R2 if the clips repo approaches ~1 GB. Note
  the real cost: rewriting asset paths does not shrink history, so reclaiming
  space needs `git filter-repo`, a force-push and a re-clone everywhere.
  Checked 2026-10-11: the inbox repository reports 413 MB (`gh api
  repos/<owner>/<clips-repo> --jq .size`), all history, since `clips pull`
  empties it on every run; the archive moved to the wiki. No images are
  clipped yet (phase 3), so the trigger is still far off.
