import type { Credential } from './credential-schema'

interface GrantedToken {
  access_token: string
  expires_in?: number
  refresh_token?: string
}

export function credentialFromTokenResponse(granted: GrantedToken, now: number): Credential {
  return {
    accessToken: granted.access_token,
    refreshToken: granted.refresh_token ?? null,
    expiresAt: granted.expires_in === undefined ? null : now + granted.expires_in * 1000,
    login: null,
  }
}
