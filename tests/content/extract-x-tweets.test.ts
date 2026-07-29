import { extractXTweets } from '../../src/content/extract-x-tweets'

// The envelope shape is irrelevant to the walk; only the entity shape matters.
function envelope(tweets: unknown[]): unknown {
  return {
    data: {
      threaded_conversation_with_injections_v2: {
        instructions: [
          {
            type: 'TimelineAddEntries',
            entries: tweets.map((result, i) => ({
              entryId: `tweet-${i}`,
              content: { itemContent: { tweet_results: { result } } },
            })),
          },
        ],
      },
    },
  }
}

const user = {
  user_results: {
    result: { legacy: { screen_name: 'iamcamengland', name: 'Cameron England' } },
  },
}

test('finds a plain tweet and expands its t.co urls', () => {
  const tweets = extractXTweets(
    envelope([
      {
        rest_id: '100',
        core: user,
        legacy: {
          full_text: 'read this https://t.co/abc now',
          created_at: 'Wed Apr 17 13:30:12 +0000 2026',
          lang: 'en',
          entities: {
            urls: [{ url: 'https://t.co/abc', expanded_url: 'https://example.com/post' }],
          },
        },
      },
    ]),
  )
  expect(tweets).toHaveLength(1)
  expect(tweets[0]).toMatchObject({
    id: '100',
    text: 'read this https://example.com/post now',
    authorHandle: 'iamcamengland',
    authorName: 'Cameron England',
    createdAt: '2026-04-17T13:30:12.000Z',
    inReplyToId: null,
    lang: 'en',
  })
})

test('prefers the full note text over the truncated preview', () => {
  const tweets = extractXTweets(
    envelope([
      {
        rest_id: '101',
        core: user,
        note_tweet: {
          note_tweet_results: {
            result: {
              text: 'the whole long-form text, well past the preview cut',
              entity_set: { urls: [] },
            },
          },
        },
        legacy: {
          full_text: 'the whole long-form text, well past…',
          created_at: 'Wed Apr 17 13:30:19 +0000 2026',
          in_reply_to_status_id_str: '100',
        },
      },
    ]),
  )
  expect(tweets[0]?.text).toBe('the whole long-form text, well past the preview cut')
  expect(tweets[0]?.inReplyToId).toBe('100')
})

test('reads the user from the post-2025 core shape', () => {
  const tweets = extractXTweets(
    envelope([
      {
        rest_id: '102',
        core: {
          user_results: {
            result: { core: { screen_name: 'someone', name: 'Some One' } },
          },
        },
        legacy: { full_text: 'hi' },
      },
    ]),
  )
  expect(tweets[0]?.authorHandle).toBe('someone')
  expect(tweets[0]?.authorName).toBe('Some One')
})

test('unwraps TweetWithVisibilityResults and ignores non-tweet objects', () => {
  const tweets = extractXTweets(
    envelope([
      {
        __typename: 'TweetWithVisibilityResults',
        tweet: { rest_id: '103', legacy: { full_text: 'wrapped' } },
      },
      { some: 'promo module', rest_id: 12345 },
    ]),
  )
  expect(tweets).toHaveLength(1)
  expect(tweets[0]).toMatchObject({ id: '103', text: 'wrapped', authorHandle: null })
})

test('returns nothing for non-graphql json', () => {
  expect(extractXTweets({ ok: true, items: [1, 'two', null] })).toEqual([])
  expect(extractXTweets('just a string')).toEqual([])
})
