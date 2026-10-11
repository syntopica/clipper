# Privacy policy

brain clipper saves the web page you choose into a GitHub repository you own.
It has no server of its own, no analytics and no advertising.

## What it reads

Only the tab you clip, and only when you click the toolbar icon or press the
keyboard shortcut: the page's URL, title, metadata and content (or your text
selection, if you made one). On x.com it also keeps the post data the page itself
loads, so that a clipped thread is complete; that data stays in the tab until
you clip it.

## Where it goes

The clip is committed to the GitHub repository you name on the options page,
through GitHub's API, using a GitHub App authorization you grant from the same
page. If you also configure a capture service (an origin you deploy yourself)
and its token, the extension sends that service the URL of each tab you open,
so the toolbar icon can show whether the page is already clipped; hosts on the
built-in or your own denylist, and local or private addresses, are never sent.
Without a capture service no browsing data leaves the browser. Nothing is sent
anywhere else.

## What it stores on your device

- Your settings: repository owner, name and branch, the GitHub App client id,
  the optional capture service origin, and host lists. These sync through your
  Chrome account. The machine name recorded in each clip stays on this device.
- Your GitHub authorization and the optional capture token, in local extension
  storage on this device only.
- Clips waiting to be committed, in the extension's local database, until they
  are committed or you remove them.

## Sharing

The developer receives none of this data. It is not sold, not used for
advertising and not shared with third parties. GitHub processes the commits
under its own terms, in a repository you control.

## Removal

Sign out on the options page to delete the authorization from this device, and
revoke it on GitHub under Settings > Applications. Removing the extension
deletes everything it stored locally.

## Contact

Open an issue at https://github.com/syntopica/clipper/issues.
