// One tweet as mined from X's own GraphQL responses. `text` is the full text -
// for long-form posts that is the note text, which the DOM only ever shows
// truncated behind a "Show more" link.
export interface XTweet {
  id: string
  text: string
  authorHandle: string | null
  authorName: string | null
  createdAt: string | null
  inReplyToId: string | null
  lang: string | null
}
