import { OFFSCREEN_DOCUMENT_PATH } from './offscreen-document-path'

let creating: Promise<void> | null = null

// A service worker has no DOM, so no DOMParser and no DOMPurify; an offscreen
// document lends it one. Chrome allows a single offscreen document per
// extension, and up to four images are prepared at once, so concurrent
// callers share one creation. The document is left open: it is one blank page,
// and closing it under a clip still sanitising would fail that clip's SVGs.
export async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  })
  if (existing.length > 0) return
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['DOM_PARSER' as chrome.offscreen.Reason],
      justification: 'Sanitise SVG images before they are committed to the clip repository.',
    })
    .finally(() => {
      creating = null
    })
  await creating
}
