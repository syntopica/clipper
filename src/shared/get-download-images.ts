import { DOWNLOAD_IMAGES_KEY } from './download-images-key'

export async function getDownloadImages(): Promise<boolean> {
  const stored = await chrome.storage.local.get([DOWNLOAD_IMAGES_KEY])
  return stored[DOWNLOAD_IMAGES_KEY] === true
}
