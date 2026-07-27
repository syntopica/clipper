export const LIMITS = {
  MAX_GIT_BLOB_BYTES: 950_000,
  MAX_SOURCE_HTML_BYTES: 950_000,
  MAX_MARKDOWN_BYTES: 950_000,
  MAX_CLIP_BYTES: 15_000_000,
  MAX_RECOVERED_LINKS: 100,
  // Only the async extraction path can block, and only where it falls back to
  // driving the page's own UI: YouTube's opens the transcript panel and polls
  // for segments. A clip that took a minute would look like a hang, and a clip
  // without a transcript beats no clip at all.
  EXTRACTION_TIMEOUT_MS: 15_000,
  MAX_DIR_NAME_CHARS: 96,
  MAX_SITE_SLUG_CHARS: 32,
} as const
