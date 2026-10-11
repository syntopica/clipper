import type { ClipAssets } from '../../shared/clip-assets'
import { NO_CLIP_ASSETS } from '../../shared/no-clip-assets'
import type { CapturedPagePayload } from '../captured-page-payload'
import { collectClipAssets } from './collect-clip-assets'
import { imagesEnabled } from './images-enabled'

// The asset step for one capture. A job queued by a build before images
// existed carries no `imageUrls`, and is clipped without them.
export async function prepareJobAssets(payload: CapturedPagePayload): Promise<ClipAssets> {
  if (!(await imagesEnabled())) return NO_CLIP_ASSETS
  return collectClipAssets(payload.imageUrls ?? [])
}
