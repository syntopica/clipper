import type { ClipState } from './clip-state'

export interface ClipStatus {
  state: ClipState
  clipUrl: string | null
  capturedAt: string | null
}
