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
Without a capture service no browsing data leaves the browser.

Images are off by default. If you switch on "Download images" on the options
page, Chrome asks you once for access to all https sites, and from then on the
images a clip references (up to 30 per clip) are fetched from the hosts the
clipped page loads them from - without your cookies - and committed to the same
repository beside the markdown. Those hosts see a request for each image, as
they did when the page displayed it. Nothing is sent anywhere else.

## What it stores on your device

- Your settings: repository owner, name and branch, the GitHub App client id,
  the optional capture service origin, and host lists. These sync through your
  Chrome account. The machine name recorded in each clip stays on this device.
- Your GitHub authorization and the optional capture token, in local extension
  storage on this device only.
- Clips waiting to be committed, with their downloaded images, in the
  extension's local database, until they are committed or you discard them
  under "Failed clips" on the options page.
- Whether images are downloaded, on this device only.

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
