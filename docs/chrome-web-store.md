# Chrome Web Store listing

The text entered in the developer dashboard, kept here so a resubmission does
not have to reconstruct it. Package with `pnpm store:zip`, which writes
`clipper-store.zip` from a fresh build without the manifest `key` (the store
signs with its own key, so the store install has a different id from an
unpacked one and is configured again).

Visibility: unlisted. Category: Tools. Language: English.

Privacy policy URL: https://github.com/syntopica/clipper/blob/main/PRIVACY.md

## Summary (132 characters max)

Clip the current page to clean markdown and commit it to a private GitHub
repository you own.

## Description

brain clipper turns the page you are reading into clean markdown and commits it
to a GitHub repository you own, in one click or with Cmd+Shift+S (Ctrl+Shift+S
elsewhere).

- Extraction through Defuddle, with site-specific handling for X, Reddit,
  YouTube, GitHub, Hacker News, Substack, Wikipedia and more; a text selection
  clips only the selection.
- Each clip is one atomic commit: the markdown, the sanitized HTML, and a
  metadata file with the URL, title, author, dates and the extractor used.
- Clips queue locally and retry, so a flaky connection does not lose one.
- No server of its own: it talks to GitHub through a GitHub App you register
  and install on that one repository.
- Optional: point it at a capture service you deploy to see, from the toolbar
  icon, whether a page is already clipped.

Setup: create a private repository, register a GitHub App with the device flow
enabled and Contents read and write permission, install it on that repository,
then enter the repository and the app's client id on the options page and sign
in. Instructions: https://github.com/syntopica/clipper#readme

## Single purpose

Save the web page the user chooses, as markdown, into a GitHub repository the
user owns.

## Permission justifications

- activeTab: read the page the user clipped, only when they invoke the
  extension on it.
- scripting: inject the extraction script into that tab to read its content.
- tabs: read tab URLs to show on the icon whether a page is already clipped
  (only when a capture service is configured), and open the GitHub sign-in
  page.
- storage: keep the settings, the GitHub authorization and the capture token.
- alarms: retry clips that could not be committed yet.
- Host permission api.github.com: commit clips through the GitHub API.
- Host permission github.com: the GitHub device-flow sign-in endpoints.
- Optional host permission https://*/*: requested for one origin only, the
  capture service the user configures.
- Content scripts on x.com / twitter.com: keep the post data the page loads so a
  clipped thread is complete; nothing is sent until the user clips.
- Remote code: none. All code ships in the package.

## Data usage disclosures

Collected: website content (the clipped page), web history (tab URLs, only to a
capture service the user configures), authentication information (the GitHub
authorization, stored locally). Not sold, not used or transferred for purposes
unrelated to the single purpose, not used for creditworthiness or lending.
