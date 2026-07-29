import { recordXTweets } from '../../src/content/record-x-tweets'
import { xTweetStash } from '../../src/content/x-tweet-stash'
import { X_GRAPHQL_MESSAGE_SOURCE } from '../../src/shared/x-graphql-message-source'

function message(tweet: unknown): unknown {
  return {
    source: X_GRAPHQL_MESSAGE_SOURCE,
    body: JSON.stringify({ data: { tweet_results: { result: tweet } } }),
  }
}

beforeEach(() => {
  xTweetStash().clear()
})

test('files tweets from a relayed response into the stash', () => {
  recordXTweets(message({ rest_id: '1', legacy: { full_text: 'hello' } }))
  expect(xTweetStash().get('1')?.text).toBe('hello')
})

test('a shorter later text never overwrites a longer one', () => {
  recordXTweets(message({ rest_id: '1', legacy: { full_text: 'the full note text' } }))
  recordXTweets(message({ rest_id: '1', legacy: { full_text: 'the full…' } }))
  expect(xTweetStash().get('1')?.text).toBe('the full note text')
})

test('a longer later text does overwrite a shorter one', () => {
  recordXTweets(message({ rest_id: '1', legacy: { full_text: 'the full…' } }))
  recordXTweets(message({ rest_id: '1', legacy: { full_text: 'the full note text' } }))
  expect(xTweetStash().get('1')?.text).toBe('the full note text')
})

test('ignores messages without the marker, and invalid json', () => {
  recordXTweets({ source: 'someone-else', body: '{}' })
  recordXTweets({ source: X_GRAPHQL_MESSAGE_SOURCE, body: 'not json {' })
  recordXTweets(null)
  recordXTweets('string')
  expect(xTweetStash().size).toBe(0)
})
