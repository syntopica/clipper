# brain clipper

Manifest V3 Chrome extension that clips the current web page to markdown and
commits it, atomically, to the private GitHub repository you configure.
`~/p/wiki` ingests those clips later; this extension never talks to the
brain directly.

Trigger: click the toolbar icon, or press `Cmd+Shift+S` (`Ctrl+Shift+S` on
non-Mac). On a page nothing has clipped, the click fires the capture directly -
no popup in the way. On a page the store already holds, the same click opens a
small panel instead, which is where a second capture is asked for deliberately.

- If you have a text selection on the page, only that selection is clipped
  (`extractor: selection`).
- Otherwise the page goes through a Defuddle-based extraction chain
  (`extractor: defuddle`, falling back through `article` / `main` /
  `body` / `innertext` as each stage fails to find usable content).

The result is sanitized HTML converted to GitHub-flavored markdown, written
to a handful of files, and committed straight to `main` via the GitHub Git
Data API (blob -> tree -> commit -> ref update), rebuilding the tree and
retrying on a non-fast-forward push.

### Extraction

[Defuddle](https://github.com/kepano/defuddle) replaced `@mozilla/readability`
because it recognises the sites this brain is actually fed from. Where
Readability had one set of heuristics for every page, Defuddle first looks for
a site-specific extractor - X, Reddit, YouTube, GitHub, Hacker News, Substack,
Wikipedia, LinkedIn, Mastodon, Bluesky, Medium, Discourse and the shared-chat
pages of ChatGPT, Claude, Gemini and Grok - and only falls back to heuristics
for everything else. Whether one of them ran is recorded per clip as
`site_extractor`.

That field is a boolean rather than the extractor's name on purpose. Defuddle
derives the name it reports from `constructor.name`, and the browser bundles it
publishes are minified, so the name arrives as `v` or `a`. Only its presence
survives the mangling.

Extraction runs against the live DOM, before sanitizing. That order matters:
the site extractors key on markers the sanitizer strips (`data-testid`
attributes for X, `meta[name="octolytics-url"]` for GitHub), so running them
against `source.html` after the fact would silently fall back to the generic
path.

### What extraction is allowed to fetch

Some extractors need the network, and whether that is acceptable depends on who
they call, not on which extractor it is. So `parseAsync()` runs with a `fetch`
that refuses any request to a host other than the page's own
(`same-origin-fetch.ts`).

YouTube's transcript passes: its innertube `player` and `next` endpoints and the
caption xml all live on `www.youtube.com`, the origin the browser is already on
and has already told everything this request would. X's async extractor does not:
it calls `publish.twitter.com` and `api.fxtwitter.com`, which would tell a third
party which post is being clipped into a private brain, from this machine.
Reddit needs no network at all - it reads the comment tree out of the page.

The async path is also the only one that can block: where the fetch route fails,
the YouTube extractor falls back to opening the transcript panel and polling the
DOM. It races `LIMITS.EXTRACTION_TIMEOUT_MS`, and the synchronous parse takes
over if it loses, because a clip without a transcript beats a clip that looks
like a hang.

A YouTube clip comes out as `## Transcript`, the video's own chapters as `###`
headings, and timestamped paragraphs under each - 133 KB of markdown for a
two-hour talk, in under a second.

### Links removed by the extractor

Any content extractor scores nodes and drops the ones it judges to be
boilerplate, and it sometimes takes real links with them. Readability did this
aggressively on anchors labelled with the url itself - X renders them exactly
that way - deleting them text and all, so the markdown kept "Anthropic
official skills repo -" and silently lost the url.

When links are dropped, the clip gains a trailing `## Links removed by the
extractor` section listing the absolute urls. Only anchors whose visible text
is itself a url are recovered: navigation, footers and "read more" chrome
never label themselves that way, so an ordinary article never grows the
section. Links the extractor kept are not repeated, duplicates collapse, and
the list is capped at `LIMITS.MAX_RECOVERED_LINKS`.

A link the page wrote as a redirect shim - YouTube wraps every url in a video
description in a 250-character `youtube.com/redirect?...&q=` and truncates the
visible text with an ellipsis - is recovered as its destination, not as the
wrapper. The wrapper is unreadable, it carries a token that expires, and
unwrapping it is also what lets the duplicate check see that the destination is
already in the clip.

Defuddle keeps those anchors, so the section no longer fires on the X page it
was written for. It stays as the net for the same failure elsewhere: Defuddle
has its own scoring, and it does drop sections other extractors keep (MDN's
"See also" is one).

## Install

```bash
git clone <this repo> clipper
cd clipper
pnpm install
pnpm build       # bundles the extension into dist/
```

Then in Chrome:

1. Open `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked" and select the `dist/` directory.

The extension id is pinned via the `key` field in `src/manifest.json` (signed
with `key.pem`, gitignored - canonical copy at `~/p/wiki/brain/sources/vault/secrets/keys/brain-clipper.pem`), so it stays
stable across machines and across unpacked loads from different paths:
`odfmlmgmcdlmmclnlagohplgpeijjeoa`.

After loading, open the extension's options page (right-click the toolbar
icon -> Options, or `chrome://extensions` -> Details -> Extension options)
and fill in the settings below before clipping anything.

## Sign in with GitHub

The options page has a **Sign in with GitHub** button. There is no token to
paste and no personal access token to create.

Authorization uses the GitHub App **device flow**, which is the only GitHub
authorization flow a browser extension can run without a server: the
authorization-code flow requires a `client_secret` to exchange the code, and
GitHub does not support PKCE for it, so a client-only extension would have to
either ship the secret or proxy through a backend. The device flow requires no
secret at all, which is why the client id is an ordinary setting on the options
page rather than a secret - it is public by design. It has no default: register
your own GitHub App (below), install it on your clip repository alone, and paste
its client id. Earlier builds compiled one owner's app id in, which meant
everyone else had to fork the extension before they could sign in.

What the button does:

1. Asks GitHub for a device code and shows an 8-character user code.
2. Opens `https://github.com/login/device` in a new tab.
3. You enter the code and approve; **leave the options page open** while it
   polls - the poll runs in that page rather than in the service worker,
   which Chrome may terminate between polls.
4. The resulting user access token is stored on this device.

### The GitHub App

Already created; nothing to do unless it has to be rebuilt.

|                       |                                                                   |
| --------------------- | ----------------------------------------------------------------- |
| Name                  | `brain clipper` (slug `brain-clipper`)                            |
| Owner                 | `@CristianDeluxe`                                                 |
| App ID                | `4401763`                                                         |
| Client ID             | `Iv23liXcjAPOv6uh7NIv` (in `src/shared/github-app-client-id.ts`)  |
| Permissions           | Repository `Contents: read & write`, `Metadata: read` (mandatory) |
| Webhook               | Off                                                               |
| Device flow           | Enabled                                                           |
| User token expiration | Enabled - 8h token plus refresh token                             |
| Installed on          | `CristianDeluxe/brain-clips` only                                 |
| Settings              | `https://github.com/settings/apps/brain-clipper`                  |

The resulting token is scoped by the app's installation, so it can only ever
reach `brain-clips` - narrower than a classic PAT, and narrower than what a
fine-grained PAT guarantees over time.

Two settings are load-bearing and easy to lose when editing the app later.
**Enable Device Flow** is off by default on a new app; without it every
sign-in fails with `device_flow_disabled`. **Expire user authorization
tokens** must stay on, because that is what issues the refresh token, and
GitHub waives `client_secret` when refreshing a token the device flow issued -
turning it off would trade secretless rotation for a token that never renews.

To recreate the app from scratch: Organization settings -> Developer settings
-> GitHub Apps -> New GitHub App, set the two settings above, grant only
`Contents: read & write`, untick the webhook, install on `brain-clips` alone,
then put the new Client ID in `src/shared/github-app-client-id.ts` and run
`pnpm build`.

### Where the token lives

The access token, refresh token and expiry are written to
`chrome.storage.local` (never `chrome.storage.sync`, so nothing roams to other
Chrome profiles) and the extension restricts that storage area to
`TRUSTED_CONTEXTS` on install/startup, which keeps it out of reach of content
scripts. It is read only at commit time to build the `Authorization` header
sent to `api.github.com`; no code path logs it.

To rotate or remove: open the options page, click "Sign out on this device"
(clears the local copy) and/or "Open GitHub to revoke access" (invalidates the
authorization server-side). Revoking on GitHub is the only way to invalidate a
leaked token - signing out only stops this machine from using it.

## What the toolbar icon says

The icon carries the state of the page in the tab, in one colour:

| Colour | Means                                                            |
| ------ | ---------------------------------------------------------------- |
| Grey   | Not captured. A click clips it.                                  |
| Amber  | Captured. The clip is waiting, or routed to the manual lane.     |
| Green  | Ingested into the brain.                                         |
| Red    | The last clip failed - the badge and the tooltip say why.        |

The answer comes from `GET /api/have` at the configured capture origin, memoised per
URL in `chrome.storage.session`. **Every failure to ask reads as grey**: no
token, no network, a service that is down. Not knowing has to look like "not
captured", because guessing the other way suppresses a capture that never
happened, while a duplicate is deduped downstream.

Amber covers both `captured` and `needs-claude` on purpose - from the browser
they mean the same thing, "we have it, the wiki does not", and the panel spells
out which one it is.

The panel also links to the clip on GitHub and offers *Capture again*. A
re-capture mints a new clip id, so it lands in its own directory and the
existing clip is untouched: a page that changed between captures is worth having
twice, and a hard block would trade one annoyance for a lost capability.

**This needs the `tabs` permission, which is a real widening.** Reading the URL
of a tab the extension was not clicked on requires it, and without it per-tab
state is not possible at all. What the extension does with that access is one
`GET` per URL to the capture service, never for a denylisted host.

## Settings fields

All fields on the options page are required before a clip can be committed:

| Field        | Meaning                                                    | Typical value         |
| ------------ | ---------------------------------------------------------- | --------------------- |
| Owner                 | GitHub org/user that owns the data repo                    | your account          |
| Repo                  | Data repo name                                             | e.g. `brain-clips`    |
| Branch                | Branch to commit clips to                                  | `main`                |
| GitHub App client id  | The app you registered for this install                    | `Iv23li...`           |
| Machine name          | Free-text label stored in each clip's `clipped_from` field | e.g. `mac-arm64-a3f2` |

Two fields are optional, and both belong to the capture service, which is a
Worker you deploy yourself (`syntopica/capture`); an install without one clips
to GitHub exactly as before. **Capture service origin** is where that
deployment answers; saving it asks Chrome for the host permission, which the
manifest declares as optional precisely because the origin is a setting.
**Capture token** is the bearer token for that origin. It is minted per device
(`node scripts/mint-token.mjs "chrome-extension"` in `brain-capture`), lives in
`chrome.storage.local` beside the GitHub credential, and is never synced -
revoking one device must leave the others alone. Empty is valid: the icon stays
grey and everything else works exactly as it did.

Owner/repo/branch are stored in `chrome.storage.sync` (they are not secret and
are the same on every machine). The machine name and the GitHub credential both
live in `chrome.storage.local`: syncing the machine name would give every
device the same `clipped_from` value and defeat the only purpose the field has.

A Chrome extension cannot read the host's name - `chrome.runtime.getPlatformInfo()`
exposes os and architecture only, and `chrome.enterprise.deviceAttributes.getDeviceHostname()`
is ChromeOS-with-policy - so the machine name is prefilled with a descriptive
`os-arch-<random>` default (`mac-arm64-a3f2`) that keeps two Macs apart, and
you can edit it to anything before saving. The only way to read a real hostname
would be a native messaging host, which means installing a native binary and
manifest per machine; that is out of proportion for a metadata label.

## Clip layout on disk

Each clip lands in the data repo under:

```
clips/pending/YYYY/MM/<YYYY-MM-DD>-<site>-<title-slug>-<clip_id[:8]>/
  index.md        # YAML frontmatter (from metadata.json) + the clipped markdown body
  source.html     # sanitized HTML snapshot - see snapshot_mode below (may be absent)
  metadata.json   # schema_version, clip_id, url, site, extractor, content_sha256, etc.
  state.json      # { status: "pending", updatedAt, failure: null, brainCommit: null }
```

`metadata.json`'s `snapshot_mode` records what `source.html` actually holds:

- `sanitized` - the whole page run through DOMPurify. DOMPurify's default
  (`WHOLE_DOCUMENT: false`) drops `<html>`, `<head>`, `<title>` and `lang`,
  so this is the sanitized **body** of the page, not the full document,
  even though the input was the whole page.
- `extracted` - only the extracted content, sanitized; used when the full
  sanitized page would exceed `MAX_SOURCE_HTML_BYTES`. This is the HTML the
  markdown was actually generated from.
- `omitted` - the snapshot exceeded `MAX_SOURCE_HTML_BYTES` and was dropped
  entirely rather than failing the whole clip; `source.html` does not exist
  for this clip, but `index.md` and the rest still commit normally.

Every capture gets a fresh `clip_id` (a ULID) and its own directory, so
re-clipping the same page creates a second, separate clip directory - this
is not deduplication. `content_sha256` is computed from the normalized
markdown body, so two clips of identical page content have identical
`content_sha256` values even though their `clip_id` and directory name
differ; that hash is what lets a later pass recognise duplicate content, not
anything in this extension. The path-exists check at commit time is an
integrity guard, not a duplicate filter: if the target directory already has
a `metadata.json` whose `clip_id` and `content_sha256` both match the clip
being committed (the same in-flight commit retried, or a resumed job in
Phase 2 reusing its `clip_id`), the commit is a no-op; if the directory
exists with a different `clip_id` or a different hash, the commit fails
loudly with `ClipConflictError` instead of overwriting anything.

`status` in `state.json` starts at `pending` - a later stage (outside this
extension) is expected to move it to `processed` or `needs-claude` and fill
in `brainCommit`. This extension only ever writes `pending`.

## Hostname denylist

Before building or uploading anything, `handleCapturedPage` refuses to clip
a denylisted host: `src/shared/denylisted-hostnames.ts` holds a conservative
starting list (mail providers, a handful of banks and payment processors),
and `src/shared/is-denylisted-hostname.ts` also refuses loopback addresses,
`.local` hostnames and private IPv4 literals (`10.0.0.0/8`, `172.16.0.0/12`,
`192.168.0.0/16`, `169.254.0.0/16`) regardless of the list. A refusal shows
up the same way any other failure does: a red badge and an action title you
can hover to read.

This starting list is not exhaustive - it is a starting point you are
expected to extend in `denylisted-hostnames.ts` for your own banking, mail
and admin domains before relying on this extension day to day.

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
- No broad host permissions granted up front - the extension reaches
  `https://api.github.com/*` and `https://github.com/*` (the latter solely for
  the device-flow endpoints). The capture service's origin is a setting, so it
  is an optional permission the options page requests for that one origin when
  you save it, and nothing else. It does not read arbitrary page content beyond
  the active tab it was explicitly invoked on.

An in-memory guard prevents a rapid double click on the same tab from
producing two clips - it clears itself five seconds after the injection
call, so it only covers a double click, not the whole service-worker
lifetime, and it does not survive a service worker restart at all - durable
cross-restart protection is deferred to the Phase 2 durable queue.

## Development

```bash
pnpm test        # Vitest, jsdom
pnpm typecheck   # tsc --noEmit
pnpm build       # esbuild -> dist/, load unpacked from there
```
