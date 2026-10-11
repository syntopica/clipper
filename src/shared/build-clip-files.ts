import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { byteLength } from './byte-length'
import type { ClipAssets } from './clip-assets'
import { ClipMetadataSchema, type ClipMetadata } from './clip-metadata-schema'
import { ClipStateSchema } from './clip-state-schema'
import { LIMITS } from './limits'
import { buildFrontmatter } from './build-frontmatter'
import { clipDirName } from './clip-dir-name'
import { clipPath } from './clip-path'
import { NO_CLIP_ASSETS } from './no-clip-assets'
import { normalizeMarkdown } from './normalize-markdown'
import { normalizeUrl } from './normalize-url'
import { rewriteImageReferences } from './rewrite-image-references'
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
  sensitivity: ClipMetadata['sensitivity']
  clippedAt: string
  clippedFrom: string
  extensionVersion: string
  // The images stored for this clip. Absent means none: every image keeps its
  // remote URL.
  assets?: ClipAssets
}

export interface ClipFiles {
  dirPath: string
  files: Record<string, string>
  // Image files, committed as binary blobs beside the text files.
  assetFiles: Record<string, ArrayBuffer>
  metadata: ClipMetadata
}

export async function buildClipFiles(input: BuildClipFilesInput): Promise<ClipFiles> {
  const assets = input.assets ?? NO_CLIP_ASSETS
  // The markdown points at the committed copies before it is hashed:
  // `content_sha256` describes the body as committed, and a retried job
  // reproduces it because its assets were persisted with it.
  const assetPaths = new Map(
    assets.files.flatMap((file) => file.urls.map((url) => [url, `assets/${file.fileName}`] as const)),
  )
  const body = normalizeMarkdown(rewriteImageReferences(input.markdown, assetPaths))
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
    sensitivity: input.sensitivity,
    content_sha256: await sha256Hex(body),
    source_html_sha256: await sha256Hex(input.sourceHtml),
    asset_count: assets.files.length,
    asset_failures: assets.failures,
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

  const assetFiles = Object.fromEntries(
    assets.files.map((file) => [`${dirPath}/assets/${file.fileName}`, file.bytes]),
  )

  const textBytes = Object.values(files).reduce((sum, value) => sum + byteLength(value), 0)
  const total = Object.values(assetFiles).reduce((sum, bytes) => sum + bytes.byteLength, textBytes)
  if (total > LIMITS.MAX_CLIP_BYTES) throw new Error(`clip exceeds ${LIMITS.MAX_CLIP_BYTES} bytes`)

  return { dirPath, files, assetFiles, metadata }
}
