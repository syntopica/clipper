# brain clipper

Manifest V3 Chrome extension that clips the current web page to markdown and
commits it, atomically, to the private `BusiRocket/brain-clips` GitHub repo.
`~/p/brain` ingests those clips later; this extension never talks to the
brain directly.

Trigger: click the toolbar icon, or press `Cmd+Shift+S` (`Ctrl+Shift+S` on
non-Mac). There is no popup - the click fires the capture directly.

- If you have a text selection on the page, only that selection is clipped
  (`extractor: selection`).
- Otherwise the page goes through a Readability-based extraction chain
  (`extractor: readability`, falling back through `article` / `main` /
  `body` / `innertext` as each stage fails to find usable content).

The result is sanitized HTML converted to GitHub-flavored markdown, written
to a handful of files, and committed straight to `main` via the GitHub Git
Data API (blob -> tree -> commit -> ref update), rebuilding the tree and
retrying on a non-fast-forward push.

## Install

```bash
git clone <this repo> brain-clipper
cd brain-clipper
pnpm install
pnpm build       # bundles the extension into dist/
```

Then in Chrome:

1. Open `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked" and select the `dist/` directory.

The extension id is pinned via the `key` field in `src/manifest.json` (signed
with `key.pem`, gitignored - canonical copy in `~/p/vault`), so it stays
stable across machines and across unpacked loads from different paths:
`odfmlmgmcdlmmclnlagohplgpeijjeoa`.

After loading, open the extension's options page (right-click the toolbar
icon -> Options, or `chrome://extensions` -> Details -> Extension options)
and fill in the settings below before clipping anything.

## Token setup

The extension commits through the GitHub API using a fine-grained personal
access token scoped to the data repo only. Create it yourself - the
extension has no OAuth flow and never requests a token on your behalf:

1. GitHub -> Settings -> Developer settings -> Personal access tokens ->
   Fine-grained tokens -> Generate new token.
2. Repository access: **only** `BusiRocket/brain-clips`. Do not grant access
   to any other repo.
3. Permissions: **Contents: Read and write**. Nothing else.
4. Set an expiry (90 days is a reasonable default) and generate the token.
5. Record the token and its expiry in `~/p/vault` - not in this repo, not in
   any commit, not in a screenshot.
6. Paste the token into the options page `GitHub token` field and click
   Save.

The token is written to `chrome.storage.local` (never `chrome.storage.sync`,
so it does not roam to other Chrome profiles) and the extension restricts
that storage area to `TRUSTED_CONTEXTS` on install/startup, which keeps it
out of reach of content scripts. It is read only at commit time to build the
`Authorization` header sent to `api.github.com`; no code path logs it.

To rotate or remove a token: open the options page, click "Remove token from
this device" (clears the local copy) and/or "Open GitHub to revoke token"
(invalidates it server-side). Revoking on GitHub is the only way to
invalidate a leaked token - removing it from the device only stops this
machine from using it.

## Settings fields

All fields on the options page are required before a clip can be committed:

| Field | Meaning | Typical value |
| --- | --- | --- |
| Owner | GitHub org/user that owns the data repo | `BusiRocket` |
| Repo | Data repo name | `brain-clips` |
| Branch | Branch to commit clips to | `main` |
| Machine name | Free-text label stored in each clip's `clipped_from` field | e.g. `cristian-mbp` |
| GitHub token | The fine-grained PAT from the previous section | (never displayed once saved; shown as `********`) |

Owner/repo/branch/machine name are stored in `chrome.storage.sync` (they are
not secret). Only the token lives in `chrome.storage.local`.

## Clip layout on disk

Each clip lands in the data repo under:

```
clips/pending/YYYY/MM/<YYYY-MM-DD>-<site>-<title-slug>-<clip_id[:8]>/
  index.md        # YAML frontmatter (from metadata.json) + the clipped markdown body
  source.html     # the sanitized HTML the markdown was generated from
  metadata.json   # schema_version, clip_id, url, site, extractor, content_sha256, etc.
  state.json      # { status: "pending", updatedAt, failure: null, brainCommit: null }
```

`content_sha256` is computed from the normalized markdown body, so clipping
the same page content twice (even at a different `clipped_at`) yields the
same hash. If a directory already exists with the same `clip_id` and
`content_sha256`, the commit is skipped as a no-op; if it exists with
different content, the commit fails loudly with `ClipConflictError` instead
of overwriting anything.

`status` in `state.json` starts at `pending` - a later stage (outside this
extension) is expected to move it to `processed` or `needs-claude` and fill
in `brainCommit`. This extension only ever writes `pending`.

## Not yet implemented (Phase 1 scope)

This is Phase 1: one click, one clip, one commit, nothing durable across
service-worker restarts. Deliberately out of scope, matching the Phase 1
plan's exclusion list:

- No durable queue (no IndexedDB-backed job store).
- No automatic retries beyond the in-request tree-rebuild-and-retry inside a
  single commit attempt.
- No `chrome.alarms`, no job leases, no multi-machine concurrency handling.
- No image or asset downloading - `asset_count` is always `0` and
  `source.html` keeps only what was already inline.
- No note or tags UI - `metadata.json` has `note` and `tags` fields, but
  nothing in the extension writes to them.
- No context menu entry point - toolbar click and `Cmd+Shift+S` only.
- No Mac-side ingest CLI, no ledger, no domain adapters - this extension
  stops at "clip committed to `brain-clips`"; anything that reads
  `clips/pending/` afterward is out of this repo.
- No Chrome Web Store packaging - "Load unpacked" only.
- No broad host permissions - the extension can only reach
  `https://api.github.com/*`; it does not read arbitrary page content beyond
  the active tab it was explicitly invoked on.

An in-memory guard prevents a double click from producing two clips within
one service-worker lifetime, but that guard does not survive a service
worker restart - that protection is deferred to the Phase 2 durable queue.

## Development

```bash
pnpm test        # Vitest, jsdom
pnpm typecheck   # tsc --noEmit
pnpm build       # esbuild -> dist/, load unpacked from there
```
