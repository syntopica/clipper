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
  Re-checked 2026-10-11 on defuddle 0.19.5: unchanged.

## Security

- [!] Move the GitHub token out of `chrome.storage.local` into the OS keychain via
  native messaging. Deferred by design; the token is currently a persisted secret
  with no keychain protection. Decided 2026-10-11 (Codex, high): stay deferred.
  Unblocks when a maintained per-machine native-host installer and update path
  exists, or evidence shows `TRUSTED_CONTEXTS` local storage is insufficient
  for this owner's threat model.

## Infrastructure

- [!] Phase 5 - publish unlisted to the Chrome Web Store. The GitHub release
  half is done (v0.2.0, logged). Deferred by the owner on 2026-10-11: no store
  publication for now. When resumed: pay the one-time developer registration
  fee in the dashboard (Chrome profile of me@cristiandeluxe.dev), upload
  `clipper-store.zip` from the latest release and fill the listing from
  `docs/chrome-web-store.md`.

## Testing

## Pending Decisions

## Future Ideas

- [ ] Migrate images to Cloudflare R2 if the clips repo approaches ~1 GB. Note
  the real cost: rewriting asset paths does not shrink history, so reclaiming
  space needs `git filter-repo`, a force-push and a re-clone everywhere.
  Checked 2026-10-11: the inbox repository reports 413 MB (`gh api
  repos/<owner>/<clips-repo> --jq .size`), all history, since `clips pull`
  empties it on every run; the archive moved to the wiki. No images are
  clipped yet (phase 3), so the trigger is still far off.
