import { resumeQueue } from './resume-queue'

export function resumeQueueSafely(): void {
  void resumeQueue().catch((error) => {
    console.error('brain clipper: could not resume the clip queue', error)
  })
}
