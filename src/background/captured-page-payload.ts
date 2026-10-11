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
  // Every http(s) image the markdown references, in page order, exactly as
  // written there: the asset step fetches these, and the committed markdown
  // swaps each stored one for its file. Absent on jobs queued by older builds.
  imageUrls: string[]
}
