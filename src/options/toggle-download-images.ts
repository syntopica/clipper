import { ALL_HTTPS_ORIGINS } from '../shared/all-https-origins'
import { setDownloadImages } from '../shared/set-download-images'
import { field } from './field'
import { say } from './say'

// The "Download images" switch. Turning it on asks Chrome for every https host
// - the request has to happen inside this click, and image hosts are only
// known after a clip is extracted, long after any gesture. Saved on its own,
// not by the Save button, because the grant already happened. Turning it off
// stops the downloads; Chrome keeps the granted access until it is removed
// under the extension's site access.
export async function toggleDownloadImages(): Promise<void> {
  const checkbox = field('downloadImages')
  if (!checkbox.checked) {
    await setDownloadImages(false)
    return say('Images stay on their sites; clips link to them.')
  }
  const granted = await chrome.permissions.request({ origins: [ALL_HTTPS_ORIGINS] })
  if (!granted) {
    checkbox.checked = false
    await setDownloadImages(false)
    return say('Images stay on their sites: Chrome did not grant access to fetch them.')
  }
  await setDownloadImages(true)
  say('Images in new clips will be downloaded into the clip.')
}
