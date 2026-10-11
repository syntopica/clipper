import { isSanitizeSvgRequest } from '../background/assets/is-sanitize-svg-request'
import { sanitizeSvg } from './sanitize-svg'

// The offscreen document's whole job: parse and sanitise SVG for the service
// worker, which has no DOM to do it in. Every other message is left alone.
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isSanitizeSvgRequest(message)) return
  sendResponse({ svg: sanitizeSvg(message.svg) })
})
