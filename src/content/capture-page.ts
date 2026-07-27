import { buildCapturedPayload } from './build-captured-payload'
import { sendToBackground } from './send-to-background'

void buildCapturedPayload(document, window, location.href).then(
  (payload) => sendToBackground(payload),
  (error: unknown) =>
    sendToBackground({
      type: 'clip-failed',
      reason: error instanceof Error ? error.message : String(error),
    }),
)
