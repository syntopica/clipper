import { hardenTokenStorage } from '../shared/harden-token-storage'
import { reportFailure } from './report-failure'

export async function hardenTokenStorageSafely(): Promise<void> {
  try {
    await hardenTokenStorage()
  } catch (error) {
    reportFailure('could not restrict token storage to trusted contexts', error)
  }
}
