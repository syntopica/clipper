import type { PageMetadata } from './collect-page-metadata'
import type { XTweet } from './x-tweet'

/**
 * Metadata for an X status page, taken from the tweet itself instead of the
 * page chrome: the DOM offers no author meta tag, `<html lang>` reports the
 * UI language rather than the tweet's, and the tab title drags along the
 * notification counter ("(16) ...").
 */
export function applyXPageMetadata(page: PageMetadata, focal: XTweet | null): PageMetadata {
  if (!focal) return page
  return {
    ...page,
    title: page.title.replace(/^\(\d+\)\s*/, ''),
    author: focal.authorHandle ? `@${focal.authorHandle}` : page.author,
    language: focal.lang ?? page.language,
    published: focal.createdAt ?? page.published,
  }
}
