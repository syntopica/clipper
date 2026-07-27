import { GITHUB_APP_CLIENT_ID } from './github-app-client-id'
import { GITHUB_OAUTH_URLS } from './github-oauth-urls'
import { postOauthForm } from './post-oauth-form'
import { TokenResponseSchema, type TokenResponse } from './token-response-schema'

const DEVICE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'

// One poll attempt. `error: authorization_pending` is the expected answer until
// the user finishes on GitHub, so this returns the response rather than throwing.
export async function exchangeDeviceCode(deviceCode: string): Promise<TokenResponse> {
  const body = await postOauthForm(GITHUB_OAUTH_URLS.accessToken, {
    client_id: GITHUB_APP_CLIENT_ID,
    device_code: deviceCode,
    grant_type: DEVICE_GRANT_TYPE,
  })
  const parsed = TokenResponseSchema.safeParse(body)
  if (!parsed.success) {
    throw new Error('GitHub returned an unrecognised token response')
  }
  return parsed.data
}
