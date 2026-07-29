import { X_GRAPHQL_MESSAGE_SOURCE } from '../shared/x-graphql-message-source'

// MAIN-world network hook for X pages. The web app already downloads the full
// text of every tweet it renders - including the long-form note text the DOM
// truncates behind "Show more" - in its own GraphQL responses. Passively
// relaying those responses to the isolated world (x-collector.ts) gives the
// capture path complete thread data with zero extra requests, no third-party
// calls, and no dependency on X's rotating queryIds. Same technique as the
// open-source twitter-web-exporter.
//
// Runs at document_start so the wrappers are in place before the app's first
// request. Never throws into the page: any failure here must degrade to "clip
// sees only the DOM", not break X.

const GRAPHQL_PATH = '/i/api/graphql/'

function relay(url: string, body: string): void {
  if (!url.includes(GRAPHQL_PATH)) return
  try {
    window.postMessage({ source: X_GRAPHQL_MESSAGE_SOURCE, body }, window.location.origin)
  } catch {
    // A body that cannot be cloned or posted is simply not relayed.
  }
}

const trackedUrls = new WeakMap<XMLHttpRequest, string>()

const originalOpen = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
  trackedUrls.set(this, String(args[1]))
  return Reflect.apply(originalOpen, this, args)
} as typeof XMLHttpRequest.prototype.open

const originalSend = XMLHttpRequest.prototype.send
XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: unknown[]) {
  this.addEventListener('load', () => {
    const url = trackedUrls.get(this)
    if (!url) return
    if (this.responseType === '' || this.responseType === 'text') {
      relay(url, this.responseText)
    } else if (this.responseType === 'json' && this.response) {
      try {
        relay(url, JSON.stringify(this.response))
      } catch {
        // Unserializable json response - skip.
      }
    }
  })
  return Reflect.apply(originalSend, this, args)
} as typeof XMLHttpRequest.prototype.send

const originalFetch = window.fetch
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const response = await originalFetch(...args)
  try {
    const input = args[0]
    const url =
      typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    if (url.includes(GRAPHQL_PATH)) {
      void response
        .clone()
        .text()
        .then((body) => relay(url, body))
        .catch(() => {})
    }
  } catch {
    // Reading the request shape failed - the page still gets its response.
  }
  return response
}
