import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export function toMarkdown(html: string): string {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })
  service.use(gfm)
  return service.turndown(html)
}
