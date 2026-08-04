import type { ClipStatus } from '../shared/clip-status'
import { capturedSentence } from './captured-sentence'
import { statusSentence } from './status-sentence'

export function renderStatus(title: string, status: ClipStatus): void {
  ;(document.getElementById('title') as HTMLElement).textContent = title
  ;(document.getElementById('state') as HTMLElement).textContent = statusSentence(status.state)
  ;(document.getElementById('detail') as HTMLElement).textContent = capturedSentence(
    status.capturedAt,
  )
  const link = document.getElementById('openClip') as HTMLAnchorElement
  if (status.clipUrl === null) link.hidden = true
  else link.href = status.clipUrl
}
