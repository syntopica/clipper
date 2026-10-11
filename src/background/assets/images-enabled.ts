import { ALL_HTTPS_ORIGINS } from '../../shared/all-https-origins'
import { getDownloadImages } from '../../shared/get-download-images'

// Images are downloaded only while the option is on and Chrome still grants the
// host access it asked for. Either missing means markdown with remote image
// URLs, exactly as before the option existed - and no failures recorded, since
// nothing was attempted.
export async function imagesEnabled(): Promise<boolean> {
  if (!(await getDownloadImages())) return false
  return chrome.permissions.contains({ origins: [ALL_HTTPS_ORIGINS] })
}
