import { DeviceCodeSchema, type DeviceCode } from './device-code-schema'
import { GITHUB_APP_CLIENT_ID } from './github-app-client-id'
import { GITHUB_OAUTH_URLS } from './github-oauth-urls'
import { postOauthForm } from './post-oauth-form'

// No `scope` is sent: a GitHub App's permissions come from the app definition and
// its installation, not from the authorization request.
export async function requestDeviceCode(): Promise<DeviceCode> {
  const body = await postOauthForm(GITHUB_OAUTH_URLS.deviceCode, {
    client_id: GITHUB_APP_CLIENT_ID,
  })
  const parsed = DeviceCodeSchema.safeParse(body)
  if (!parsed.success) {
    throw new Error('GitHub did not return a device code - is the device flow enabled on the app?')
  }
  return parsed.data
}
