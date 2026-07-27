// Defuddle's async extractors need the network, and whether that is acceptable
// depends entirely on who they call. YouTube's transcript path only ever hits
// www.youtube.com - its innertube `player` and `next` endpoints and the caption
// xml - which is the origin the page already is, and the browser has already
// told it everything this request would. X's async extractor instead calls
// publish.twitter.com and api.fxtwitter.com, telling a third party which post
// is being clipped, into a private brain, from this machine.
//
// So the rule is the origin, not the extractor: a request to the page's own
// host goes through, anything else is refused before it is made. That keeps the
// guarantee the sync-only path used to give - nothing about a clipped page
// reaches a third party - while letting the same-origin extractors work.
export function sameOriginFetch(pageHostname: string): typeof globalThis.fetch {
  return (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    let hostname: string
    try {
      hostname = new URL(url, `https://${pageHostname}`).hostname
    } catch {
      return Promise.reject(new Error(`extraction blocked an unparseable url: ${url}`))
    }
    if (hostname !== pageHostname) {
      return Promise.reject(
        new Error(`extraction blocked a cross-origin request to ${hostname}`),
      )
    }
    return fetch(input, init)
  }
}
