import type { ClipAssets } from './clip-assets'

// A clip with no images stored: what every clip was before images could be
// downloaded, and what it still is while the option is off.
export const NO_CLIP_ASSETS: ClipAssets = { files: [], failures: [] }
