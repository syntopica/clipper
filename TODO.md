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

- [~] One clip is `status: processed` while still sitting under `clips/pending/`:
  the Claude-skills clip (`01KYGGCNH0HN292WZ1VQGVR2XW`) was ingested into the
  brain by hand on 2026-07-27 and its `state.json` updated with
  `brainCommit: 4c97fb2`, but nothing moved the directory to `processed/`
  because the mover is phase 4. Whatever implements the move must treat a
  `processed` clip found under `pending/` as "move me", not as an error.

- [ ] Phase 4 - Mac-side ingest CLI at `~/p/brain/tools/clips` (TypeScript, not
  bash): ledger at `brain/.ingest/clips/<clip_id>.json`, deterministic routing
  before codex, sandboxed synthesis in a throwaway worktree, patch validation,
  `needs-claude` routing. Lives in the brain repo, not here.

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
- [ ] Revisit `MIN_READABILITY_TEXT_LENGTH = 100` after real use. It is fixture-fitted,
  and it is the single knob deciding `readability` versus the DOM-shape chain.
- [ ] Phase 5 - domain adapters for GitHub READMEs, X threads, documentation
  sites and shadow-DOM pages, behind an `ExtractionAdapter` interface.
- [ ] Migrate images to Cloudflare R2 if the clips repo approaches ~1 GB. Note
  the real cost: rewriting asset paths does not shrink history, so reclaiming
  space needs `git filter-repo`, a force-push and a re-clone everywhere.
