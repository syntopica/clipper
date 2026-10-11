import { DOWNLOAD_IMAGES_KEY } from './download-images-key'

export async function setDownloadImages(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [DOWNLOAD_IMAGES_KEY]: enabled })
}
