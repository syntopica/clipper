import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'

export interface CapturedPagePayload {
  type: 'clip-captured'
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized'
  extractor: Extractor
  siteExtractor: boolean
  page: PageMetadata
}
