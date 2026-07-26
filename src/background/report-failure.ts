import { setBadge } from './set-badge'

export function reportFailure(context: string, error: unknown): void {
  console.error(`brain clipper: ${context}`, error)
  void setBadge('error').catch((badgeError) => {
    console.error('brain clipper: could not set the error badge', badgeError)
  })
}
