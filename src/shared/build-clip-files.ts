import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { byteLength } from './byte-length'
import { ClipMetadataSchema, type ClipMetadata } from './clip-metadata-schema'
import { ClipStateSchema } from './clip-state-schema'
import { LIMITS } from './limits'
import { buildFrontmatter } from './build-frontmatter'
import { clipDirName } from './clip-dir-name'
import { clipPath } from './clip-path'
import { normalizeMarkdown } from './normalize-markdown'
import { normalizeUrl } from './normalize-url'
import { sha256Hex } from './sha256-hex'

export interface BuildClipFilesInput {
  clipId: string
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized' | 'full-page'
  extractor: Extractor
  siteExtractor: boolean
  page: PageMetadata
  clippedAt: string
  clippedFrom: string
  extensionVersion: string
}

export interface ClipFiles {
  dirPath: string
  files: Record<string, string>
  metadata: ClipMetadata
}

export async function buildClipFiles(input: BuildClipFilesInput): Promise<ClipFiles> {
  const body = normalizeMarkdown(input.markdown)
  if (byteLength(body) > LIMITS.MAX_MARKDOWN_BYTES) {
    throw new Error(`markdown exceeds ${LIMITS.MAX_MARKDOWN_BYTES} bytes`)
  }

  // The per-file cap exists for git blob hygiene, not correctness: an
  // oversized snapshot must not take the markdown - the actual payload -
  // down with it. Drop the snapshot and record that in the metadata instead
  // of throwing.
  const sourceHtmlFits = byteLength(input.sourceHtml) <= LIMITS.MAX_SOURCE_HTML_BYTES
  const snapshotMode = sourceHtmlFits ? input.snapshotMode : 'omitted'

  const metadata = ClipMetadataSchema.parse({
    schema_version: 1,
    clip_id: input.clipId,
    title: input.page.title,
    url: input.url,
    normalized_url: normalizeUrl(input.url),
    canonical_url: input.page.canonicalUrl,
    site: input.page.site,
    author: input.page.author,
    published: input.page.published,
    language: input.page.language,
    clipped_at: input.clippedAt,
    clipped_from: input.clippedFrom,
    extension_version: input.extensionVersion,
    extractor: input.extractor,
    site_extractor: input.siteExtractor,
    extractor_version: input.extractor === 'defuddle' ? DEFUDDLE_VERSION : null,
    snapshot_mode: snapshotMode,
    sensitivity: 'public',
    content_sha256: await sha256Hex(body),
    source_html_sha256: await sha256Hex(input.sourceHtml),
    asset_count: 0,
    asset_failures: [],
    note: '',
    tags: [],
    word_count: body.split(/\s+/).filter(Boolean).length,
  } satisfies ClipMetadata)

  const state = ClipStateSchema.parse({
    status: 'pending',
    updatedAt: input.clippedAt,
    failure: null,
    brainCommit: null,
  })

  const dirPath = clipPath({
    clippedAt: input.clippedAt,
    dirName: clipDirName({
      clippedAt: input.clippedAt,
      site: input.page.site,
      title: input.page.title,
      clipId: input.clipId,
    }),
  })

  const files: Record<string, string> = {
    [`${dirPath}/index.md`]: `${buildFrontmatter(metadata)}\n${body}`,
    [`${dirPath}/metadata.json`]: `${JSON.stringify(metadata, null, 2)}\n`,
    [`${dirPath}/state.json`]: `${JSON.stringify(state, null, 2)}\n`,
  }
  if (sourceHtmlFits) {
    files[`${dirPath}/source.html`] = input.sourceHtml
  }

  const total = Object.values(files).reduce((sum, value) => sum + byteLength(value), 0)
  if (total > LIMITS.MAX_CLIP_BYTES) throw new Error(`clip exceeds ${LIMITS.MAX_CLIP_BYTES} bytes`)

  return { dirPath, files, metadata }
}
