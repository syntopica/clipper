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
  const site = slugify(input.site)
  const suffix = input.clipId.slice(0, 8).toLowerCase()
  const prefix = `${date}-${site}-`
  const budget = LIMITS.MAX_DIR_NAME_CHARS - prefix.length - suffix.length - 1
  const title = slugify(input.title).slice(0, Math.max(budget, 0)).replace(/-+$/, '')
  return `${prefix}${title}-${suffix}`
}
