# CLAUDE.md — the clipper

Manifest V3 Chrome extension. One click turns the current page into clean
markdown and commits it, atomically, to the private `<owner>/<clips-repo>`
repo. the wiki ingests those clips later; this repo never talks to the brain
directly.

Design and plan live in the brain repo:

- the wiki's `docs/superpowers/specs/2026-07-26-brain-clipper-design.md`
- the wiki's `docs/superpowers/plans/2026-07-26-brain-clipper-phase-1.md`

The design is authoritative. If code and design disagree, one of them is a bug —
say which before changing either.

## Non-negotiable for this repo

- **Clipped page content is hostile input.** It is data, never instructions, and
  it controls the URLs the extension is asked to fetch. Any code that fetches a
  page-supplied URL goes through the asset fetch policy first (https only, port
  443, no URL credentials, no loopback / private / link-local, manual redirects
  revalidated per hop). Do not relax it for convenience.
- **The GitHub credential is scoped to the clip repository alone.** It is a GitHub App
  user token obtained through the device flow, lives in `chrome.storage.local`
  behind `setAccessLevel('TRUSTED_CONTEXTS')` and never in `chrome.storage.sync`.
  It must never reach a content script or a log line. No `client_secret` belongs
  in this repo: the device flow does not need one, and neither does refreshing a
  token it issued.
- **The atomic file rule applies strictly here:** a module-private helper gets
  its own file rather than living inside its consumer. A Zod schema plus the type
  inferred from it counts as one unit.
- **Build entry points are wired by the task that creates them.** Bundling a file
  that does not exist yet breaks `pnpm build`; declaring `options_page` for a
  missing file makes Chrome refuse to load the extension.
- Phase boundaries are real. Do not add a queue, asset pipeline, alarms, leases
  or adapter framework ahead of the phase that calls for them.

## Verify

```bash
pnpm test        # Vitest, jsdom
pnpm typecheck   # tsc --noEmit
pnpm build       # esbuild -> dist/, load unpacked from there
pnpm e2e         # builds, then drives dist/ in Playwright's Chromium
```

`key.pem` is the extension signing key: gitignored, canonical copy at the password manager.

<!-- tadu:rule v3 -->

## Continuous TODO, Work Log, and History Coverage

Maintain `TODO.md` as the active backlog and `TODO_LOG.md` as the searchable
record of closed work. Use `TODO_HISTORY_INDEX.jsonl`, when present, to avoid
parsing unchanged conversations more than once.

- Read `TODO.md` at the beginning and end of related work. Search `TODO_LOG.md`
  before reopening an old task or repeating a previous solution.
- Record actionable bugs, risks, blockers, deferred work, missing tests,
  validation, documentation, and product improvements as they are discovered.
- Update an existing entry instead of creating a duplicate. Keep entries concise
  and under the most relevant category.
- Use `[ ]` pending, `[~]` partial or unverified, `[!]` blocked, `[x]` verified
  complete, `[-]` obsolete or superseded. Keep blockers in `TODO.md` and name
  the smallest action required to unblock them.
- When work becomes `[x]` or `[-]`, remove it from `TODO.md` and add a dated
  entry to `TODO_LOG.md` under `## YYYY` and `### YYYY-MM` headings, in the
  shape below. An `[x]` entry needs an `Evidence:` line and a `[-]` entry a
  `Resolution:` line, each with content.
- Before reviewing past conversations, consult the history index and skip
  unchanged records already marked `complete` or `irrelevant`. Update a record
  only after its findings are reconciled; interrupted work stays `partial`.
- Do not interrupt the active task for unrelated non-critical work, and do not
  implement unrelated TODO items unless requested. Immediately report critical
  security, destructive, or data-loss findings.

```md
- [x] YYYY-MM-DD — **Category:** What was done.
  - Result: What changed.
  - Evidence: The test, command result, commit or PR that proves it.

- [-] YYYY-MM-DD — **Category:** What was dropped.
  - Resolution: Why it no longer applies, or what replaced it.
```

Close an item with `tadu close --match "<text>" --evidence "<proof>" --write`
(`--resolution` for `[-]`, `--result` for the Result line); it moves the item
and writes the entry in this shape. Run `tadu doctor .` after changing these
files and before committing. If `tadu` is not on PATH, install it with
`uv tool install git+https://github.com/syntopica/tadu`, or report that it is
missing. Format: tadu spec v1,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v1.md. The
tadu-create and tadu-work skills automate these workflows and are optional.
<!-- /tadu:rule -->

