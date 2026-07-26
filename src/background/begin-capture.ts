import { reportFailure } from './report-failure'
import { startCapture } from './start-capture'

export function beginCapture(tabId: number): void {
  void startCapture(tabId).catch((error) => reportFailure('could not inject the capture script', error))
}
