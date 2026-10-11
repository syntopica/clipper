import type { SanitizeSvgRequest } from './sanitize-svg-request'

export function isSanitizeSvgRequest(value: unknown): value is SanitizeSvgRequest {
  const message = value as Partial<SanitizeSvgRequest> | null
  return (
    typeof value === 'object' &&
    message !== null &&
    message.target === 'offscreen' &&
    message.type === 'sanitize-svg' &&
    typeof message.svg === 'string'
  )
}
