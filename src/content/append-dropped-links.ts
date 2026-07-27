import type { DroppedLink } from './dropped-content-links'

// Appended rather than spliced back into place: where each link belonged is not
// recoverable once the extractor has removed the node, and inventing a position
// would be a worse lie than an honest list at the end. The heading says who
// dropped them so a reader knows this section is not part of the source.
export function appendDroppedLinks(markdown: string, links: DroppedLink[]): string {
  if (links.length === 0) return markdown
  const list = links.map((link) => `- <${link.href}>`).join('\n')
  return `${markdown}\n\n## Links removed by the extractor\n\n${list}\n`
}
