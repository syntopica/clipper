import type { Credential } from './credential-schema'
import { credentialFromTokenResponse } from './credential-from-token-response'
import { deviceFlowErrorMessage } from './device-flow-error-message'
import { GITHUB_APP_CLIENT_ID } from './github-app-client-id'
import { GITHUB_OAUTH_URLS } from './github-oauth-urls'
import { postOauthForm } from './post-oauth-form'
import { TokenResponseSchema } from './token-response-schema'

// No `client_secret`: GitHub waives it for tokens that were issued through the
// device flow, which is what makes a secretless extension possible at all.
export async function refreshCredential(credential: Credential): Promise<Credential> {
  if (!credential.refreshToken) {
    throw new Error('the GitHub session expired and cannot be renewed - open the options page')
  }

  const body = await postOauthForm(GITHUB_OAUTH_URLS.accessToken, {
    client_id: GITHUB_APP_CLIENT_ID,
    refresh_token: credential.refreshToken,
    grant_type: 'refresh_token',
  })
  const parsed = TokenResponseSchema.safeParse(body)
  if (!parsed.success) {
    throw new Error('GitHub returned an unrecognised token response - open the options page')
  }
  if ('error' in parsed.data) {
    const reason = deviceFlowErrorMessage(parsed.data.error, parsed.data.error_description)
    throw new Error(`${reason} Sign in again - open the options page`)
  }

  return { ...credentialFromTokenResponse(parsed.data, Date.now()), login: credential.login }
}
