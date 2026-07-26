import { buildCapturedPayload } from './build-captured-payload'
import { sendToBackground } from './send-to-background'

try {
  void sendToBackground(buildCapturedPayload(document, window, location.href))
} catch (error) {
  void sendToBackground({
    type: 'clip-failed',
    reason: error instanceof Error ? error.message : String(error),
  })
}
