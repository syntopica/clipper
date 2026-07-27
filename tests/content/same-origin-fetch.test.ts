import { sameOriginFetch } from '../../src/content/same-origin-fetch'

const original = globalThis.fetch

afterEach(() => {
  globalThis.fetch = original
})

function spyFetch(): { calls: string[] } {
  const calls: string[] = []
  globalThis.fetch = ((input: RequestInfo | URL) => {
    calls.push(String(input))
    return Promise.resolve(new Response('ok'))
  }) as typeof globalThis.fetch
  return { calls }
}

test('a request to the page own host goes through', async () => {
  const spy = spyFetch()
  const guarded = sameOriginFetch('www.youtube.com')

  await guarded('https://www.youtube.com/youtubei/v1/player?prettyPrint=false')

  expect(spy.calls).toEqual(['https://www.youtube.com/youtubei/v1/player?prettyPrint=false'])
})

test('a relative url resolves against the page host and goes through', async () => {
  const spy = spyFetch()
  const guarded = sameOriginFetch('www.youtube.com')

  await guarded('/api/timedtext?v=abc')

  expect(spy.calls).toHaveLength(1)
})

test('a third-party request is refused before it is made', async () => {
  const spy = spyFetch()
  const guarded = sameOriginFetch('x.com')

  await expect(guarded('https://api.fxtwitter.com/user/status/1')).rejects.toThrow(
    'blocked a cross-origin request to api.fxtwitter.com',
  )
  await expect(guarded('https://publish.twitter.com/oembed?url=x')).rejects.toThrow(
    'blocked a cross-origin request to publish.twitter.com',
  )
  expect(spy.calls).toEqual([])
})

// A subdomain is a different host and a different party: whoever answers for
// cdn.example.com need not be whoever answers for example.com.
test('a subdomain of the page host is still refused', async () => {
  const spy = spyFetch()
  const guarded = sameOriginFetch('example.com')

  await expect(guarded('https://cdn.example.com/x')).rejects.toThrow('blocked a cross-origin')
  expect(spy.calls).toEqual([])
})

test('a Request object is checked by its url, not passed through', async () => {
  const spy = spyFetch()
  const guarded = sameOriginFetch('www.youtube.com')

  await expect(guarded(new Request('https://evil.example/steal'))).rejects.toThrow(
    'blocked a cross-origin request to evil.example',
  )
  expect(spy.calls).toEqual([])
})
