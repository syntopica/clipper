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

- [!] Load the extension unpacked from `/Users/cristiandeluxe/p/brain-clipper/dist`
  and confirm the id is `odfmlmgmcdlmmclnlagohplgpeijjeoa`. Blocked on: a human
  clicking through `chrome://extensions`; no agent can do it.
- [!] Create the fine-grained GitHub PAT (repository access limited to
  `BusiRocket/brain-clips`, `Contents: read+write`, 90-day expiry) and record it
  plus its expiry in `~/p/vault`. Blocked on: human GitHub session. Needed before
  any clip can be committed.

## Backend

- [ ] Task 3 - page extraction: selection, Readability chain, DOMPurify
  sanitizing, Turndown + GFM, page metadata. Files under `src/content/`.
- [ ] Task 4 - clip assembly: `build-frontmatter` (js-yaml), `build-clip-files`,
  `normalize-url`, byte-cap enforcement.
- [ ] Task 5 - settings in `chrome.storage.sync`, token in `chrome.storage.local`
  with `setAccessLevel('TRUSTED_CONTEXTS')`, options page; adds `options_page` to
  the manifest and the options entry point to `build.mjs`.
- [ ] Task 6 - GitHub Git Data API primitives and `check-existing-clip`.
- [ ] Task 7 - `commit-clip`: atomic commit, rebuild tree and commit on
  non-fast-forward, three-way path-exists rule.
- [ ] Task 8 - wiring: injected `capture-page`, service worker listeners, badge,
  in-flight guard; adds the content entry point to `build.mjs`.
- [ ] Task 9 - end-to-end verification against the real repo plus README.

## Integrations

- [ ] Phase 4 - Mac-side ingest CLI at `~/p/brain/tools/clips` (TypeScript, not
  bash): ledger at `brain/.ingest/clips/<clip_id>.json`, deterministic routing
  before codex, sandboxed synthesis in a throwaway worktree, patch validation,
  `needs-claude` routing. Lives in the brain repo, not here.

## Security

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

- [ ] Phase 5 - domain adapters for GitHub READMEs, X threads, documentation
  sites and shadow-DOM pages, behind an `ExtractionAdapter` interface.
- [ ] Migrate images to Cloudflare R2 if the clips repo approaches ~1 GB. Note
  the real cost: rewriting asset paths does not shrink history, so reclaiming
  space needs `git filter-repo`, a force-push and a re-clone everywhere.
