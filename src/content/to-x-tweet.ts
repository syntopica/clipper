import { expandTcoUrls } from './expand-tco-urls'
import type { XTweet } from './x-tweet'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

// X moved the user's screen_name/name from `result.legacy` to `result.core`
// during 2025; responses in the wild still show either shape depending on the
// endpoint, so both are read.
function userField(user: Record<string, unknown> | null, field: string): string | null {
  if (!user) return null
  return asString(asRecord(user.legacy)?.[field]) ?? asString(asRecord(user.core)?.[field])
}

// "Wed Apr 17 13:30:12 +0000 2026" - the legacy twitter date format.
function toIsoDate(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/**
 * A tweet entity from a GraphQL response object, or null when the object is
 * not one. The signature is `rest_id` plus `legacy.full_text` - stable across
 * every timeline and detail endpoint since the GraphQL migration.
 *
 * Full text precedence: `note_tweet` (long-form posts, only ever truncated in
 * the DOM) over `legacy.full_text`.
 */
export function toXTweet(candidate: Record<string, unknown>): XTweet | null {
  const id = asString(candidate.rest_id)
  const legacy = asRecord(candidate.legacy)
  const legacyText = asString(legacy?.full_text)
  if (!id || !legacy || legacyText === null) return null

  const note = asRecord(asRecord(asRecord(candidate.note_tweet)?.note_tweet_results)?.result)
  const noteText = asString(note?.text)
  const entityLists = noteText
    ? [asRecord(note?.entity_set)?.urls]
    : [asRecord(legacy.entities)?.urls, asRecord(legacy.entities)?.media]

  const user = asRecord(asRecord(asRecord(candidate.core)?.user_results)?.result)

  return {
    id,
    text: expandTcoUrls(noteText ?? legacyText, entityLists),
    authorHandle: userField(user, 'screen_name'),
    authorName: userField(user, 'name'),
    createdAt: toIsoDate(asString(legacy.created_at)),
    inReplyToId: asString(legacy.in_reply_to_status_id_str),
    lang: asString(legacy.lang),
  }
}
