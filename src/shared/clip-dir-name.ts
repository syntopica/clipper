import { LIMITS } from './limits'
import { slugify } from './slugify'

interface ClipDirNameInput {
  clippedAt: string
  site: string
  title: string
  clipId: string
}

export function clipDirName(input: ClipDirNameInput): string {
  const date = input.clippedAt.slice(0, 10)
  const suffix = input.clipId.slice(0, 8).toLowerCase()
  const site = slugify(input.site).slice(0, LIMITS.MAX_SITE_SLUG_CHARS).replace(/-+$/, '')
  const fixedLength = [date, site, suffix].filter(Boolean).join('-').length
  const budget = LIMITS.MAX_DIR_NAME_CHARS - fixedLength - 1
  const title = budget > 0 ? slugify(input.title).slice(0, budget).replace(/-+$/, '') : ''
  return [date, site, title, suffix].filter(Boolean).join('-')
}
