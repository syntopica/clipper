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

Design: `~/p/brain/docs/superpowers/specs/2026-07-26-brain-clipper-design.md`
Phase 1 plan: `~/p/brain/docs/superpowers/plans/2026-07-26-brain-clipper-phase-1.md`

## Blocked Tasks

## Testing

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

- [~] One clip is `status: processed` while still sitting under `clips/pending/`:
  the Claude-skills clip (`01KYGGCNH0HN292WZ1VQGVR2XW`) was ingested into the
  brain by hand on 2026-07-27 and its `state.json` updated with
  `brainCommit: 4c97fb2`, but nothing moved the directory to `processed/`
  because the mover is phase 4. Whatever implements the move must treat a
  `processed` clip found under `pending/` as "move me", not as an error.

- [~] Phase 4 - Mac-side ingest CLI at `~/p/brain/tools/clips` (TypeScript, not
  bash): ledger at `brain/.ingest/clips/<clip_id>.json`, deterministic routing,
  a throwaway worktree, patch validation, `needs-claude` routing. Lives in the
  brain repo, not here. Milestone 1 is done and it removed the codex half:
  **codex synthesis is disabled for phase 4**. `codex exec -s workspace-write`
  leaves filesystem reads unrestricted - a probe read a canary outside the
  workspace and listed all of `~/.ssh` - and no read-restricting boundary could
  be found that codex still runs inside. Verdict, the ten mechanisms evaluated
  and the evidence are in `~/p/brain/tools/clips/boundary-decision.json`, and
  the reusable `sandbox-exec` boundary that DID pass all nine assertions for
  plain commands is in that package. Milestone 2 plans the pipeline without a
  synthesizer; codex candidates route to the manual Claude workflow.

- [ ] Revisit codex synthesis only via a stronger boundary - a dedicated macOS
  user account, a container, or an ephemeral VM, with `workspace-write` still
  inside it and never `--dangerously-bypass-approvals-and-sandbox`. That attempt
  was never tried, not tried and failed. Wrapping codex in an outer sandbox and
  disabling its inner one is NOT a substitute: the orchestrator needs network to
  reach the model, so the model's own commands inherit it, discarding the one
  property `workspace-write` did provide.

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

- [~] Phase 2, do this FIRST - move `newClipId()` and `clippedAt` out of
  `handleCapturedPage` to the enqueue boundary. A resumed job must reuse both or it
  lands in a different directory and the `identical`/`conflict` rule never fires, which
  is the whole basis of safe resumption.
- [ ] Phase 2 - a `GithubRequestError` carrying status and response headers. Status
  currently lives only inside error message strings across six call sites, and the
  queue's state machine has to separate permanent (401/403, conflict) from transient
  (429/5xx/offline) and read `Retry-After`.
- [ ] Phase 2 - no MV3 keepalive around the commit sequence: `fetch` does not reset the
  30-second idle timer, so a slow connection can lose a clip and leave the badge stuck
  on `...`. No partial clip can result - the ref update is the only mutation. A stuck
  `...` means "worker died, clip lost", not "hung".
- [ ] Backoff on the four concurrent blob POSTs - exactly the burst pattern GitHub's
  secondary rate limits watch for. Phase 1 has none.
- [ ] Per-tab badge. It is global today, so two captures within four seconds can clear
  each other's result.
- [ ] Phase 2 - durable IndexedDB job queue, state machine persisted per
  transition, `alarms` permission with `onStartup`/`onInstalled` resume, job
  leases, exponential backoff honouring `Retry-After`.
- [ ] Phase 5 - publish unlisted to the Chrome Web Store and ship `dist.zip`
  through GitHub Releases, replacing per-machine unpacked loads.
- [ ] Pin `@types/node` to the major matching the Node >= 20 floor. The installed
  major is far ahead and can admit typings for APIs missing on Node 20.

## Testing

- [~] Confirm Defuddle's site extractors fire per site. Done for X (a real clip
  of a long-form post: 28 KB of markdown, ten headings, seventeen fenced code
  blocks, no X chrome) and, by running the shipped `buildCapturedPayload` bundle
  over freshly fetched live html, for Hacker News, Reddit (nested comment threads
  with scores and permalinks), GitHub and Wikipedia. A plain blog correctly
  reports `site_extractor: false`.

  YouTube needed the async path and now works: 133 KB of markdown from a
  two-hour talk, `## Transcript` with the video's chapters as `###` headings and
  timestamped paragraphs, in 0.7s, with all four requests going to
  www.youtube.com. Still worth one real-browser clip to confirm, since this was
  measured over curl-fetched html in jsdom.
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
