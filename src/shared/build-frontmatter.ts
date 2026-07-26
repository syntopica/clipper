import { dump } from 'js-yaml'
import type { ClipMetadata } from './clip-metadata-schema'

export function buildFrontmatter(metadata: ClipMetadata): string {
  const yaml = dump(metadata, { lineWidth: -1, noRefs: true, quoteStyle: 'double' })
  return `---\n${yaml}---\n`
}
