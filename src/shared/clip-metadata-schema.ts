import { z } from 'zod'

export const ClipMetadataSchema = z.object({
  schema_version: z.literal(1),
  clip_id: z.string().min(26),
  title: z.string(),
  url: z.string().url(),
  normalized_url: z.string().url(),
  canonical_url: z.string().url().nullable(),
  site: z.string(),
  author: z.string().nullable(),
  published: z.string().nullable(),
  language: z.string().nullable(),
  clipped_at: z.string(),
  clipped_from: z.string(),
  extension_version: z.string(),
  extractor: z.enum(['selection', 'readability', 'article', 'main', 'body', 'innertext']),
  extractor_version: z.string().nullable(),
  snapshot_mode: z.enum(['extracted', 'sanitized', 'full-page', 'omitted']),
  sensitivity: z.enum(['public', 'private', 'restricted']),
  content_sha256: z.string().length(64),
  source_html_sha256: z.string().length(64),
  asset_count: z.number().int().nonnegative(),
  asset_failures: z.array(z.string()),
  note: z.string(),
  tags: z.array(z.string()),
  word_count: z.number().int().nonnegative(),
})

export type ClipMetadata = z.infer<typeof ClipMetadataSchema>
