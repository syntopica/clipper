import { z } from 'zod'

// `expiresAt` is epoch milliseconds. Both it and `refreshToken` are null when the
// GitHub App has user-token expiration disabled, in which case the access token
// stays valid until the user revokes the authorization.
export const CredentialSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullable(),
  expiresAt: z.number().int().positive().nullable(),
  login: z.string().nullable(),
})

export type Credential = z.infer<typeof CredentialSchema>
