import { ensureOffscreenDocument } from './ensure-offscreen-document'
import type { SanitizeSvgRequest } from './sanitize-svg-request'

// The sanitised SVG, or null when it is not an SVG document at all.
export async function sanitizeSvgOffscreen(svg: string): Promise<string | null> {
  await ensureOffscreenDocument()
  const request: SanitizeSvgRequest = { target: 'offscreen', type: 'sanitize-svg', svg }
  const response = (await chrome.runtime.sendMessage(request)) as { svg: string | null } | undefined
  return response?.svg ?? null
}
