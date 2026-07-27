import type { Credential } from './credential-schema'
import type { DeviceCode } from './device-code-schema'
import { credentialFromTokenResponse } from './credential-from-token-response'
import { deviceFlowErrorMessage } from './device-flow-error-message'
import { exchangeDeviceCode } from './exchange-device-code'
import { sleep } from './sleep'

const SLOW_DOWN_PENALTY_SECONDS = 5

// Polls until the user finishes on GitHub, the code expires, or GitHub refuses.
// Runs in the options page rather than the service worker on purpose: a worker
// can be terminated between polls, a visible options tab cannot.
export async function pollForCredential(deviceCode: DeviceCode): Promise<Credential> {
  const deadline = Date.now() + deviceCode.expires_in * 1000
  let intervalSeconds = deviceCode.interval

  while (Date.now() < deadline) {
    await sleep(intervalSeconds * 1000)
    const response = await exchangeDeviceCode(deviceCode.device_code)

    if ('access_token' in response) return credentialFromTokenResponse(response, Date.now())
    if (response.error === 'authorization_pending') continue
    if (response.error === 'slow_down') {
      intervalSeconds = response.interval ?? intervalSeconds + SLOW_DOWN_PENALTY_SECONDS
      continue
    }
    throw new Error(deviceFlowErrorMessage(response.error, response.error_description))
  }

  throw new Error('The code expired before it was entered on GitHub. Start again.')
}
