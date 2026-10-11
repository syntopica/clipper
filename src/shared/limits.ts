export const LIMITS = {
  MAX_GIT_BLOB_BYTES: 950_000,
  MAX_SOURCE_HTML_BYTES: 950_000,
  MAX_MARKDOWN_BYTES: 950_000,
  MAX_CLIP_BYTES: 15_000_000,
  // Images per clip, how many are fetched at once, and the bytes all of them
  // may add together. The budget leaves room under MAX_CLIP_BYTES for a
  // markdown body and a snapshot at their own caps, so a clip full of images
  // still commits instead of failing on its total.
  MAX_IMAGES_PER_CLIP: 30,
  IMAGE_FETCH_CONCURRENCY: 4,
  // One image host that never answers must not hold the clip for the whole
  // five-minute lease.
  IMAGE_FETCH_TIMEOUT_MS: 20_000,
  MAX_ASSET_BYTES: 12_000_000,
  // The most a fetched image may weigh before it is processed, enforced while
  // the body streams in, and the most pixels one may decode to. A small file
  // can declare a huge canvas - 20000x20000 is 1.6 GB of RGBA - so dimensions
  // are read from the header and checked before anything is decoded.
  MAX_FETCHED_IMAGE_BYTES: 20_000_000,
  MAX_DECODED_PIXELS: 24_000_000,
  // Frames times canvas area for an animation. Only the first frame is ever
  // decoded here, but the GIF is stored as it came and every viewer of the clip
  // decodes all of it.
  MAX_ANIMATION_PIXELS: 200_000_000,
  // Raster images are re-encoded as WebP at this quality, the long edge capped.
  MAX_IMAGE_EDGE_PX: 1600,
  WEBP_QUALITY: 0.82,
  MAX_RECOVERED_LINKS: 100,
  // Only the async extraction path can block, and only where it falls back to
  // driving the page's own UI: YouTube's opens the transcript panel and polls
  // for segments. A clip that took a minute would look like a hang, and a clip
  // without a transcript beats no clip at all.
  EXTRACTION_TIMEOUT_MS: 15_000,
  MAX_DIR_NAME_CHARS: 96,
  MAX_SITE_SLUG_CHARS: 32,
} as const
