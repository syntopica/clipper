import { z } from 'zod'

// GitHub answers both the device-flow poll and the refresh exchange with HTTP
// 200 either way: a grant lands in `access_token`, everything else - including
// the benign "the user has not finished yet" - lands in `error`.
export const TokenResponseSchema = z.union([
  z.object({
    access_token: z.string().min(1),
    // Both fields are omitted when the app has user-token expiration disabled.
    expires_in: z.number().int().positive().optional(),
    refresh_token: z.string().min(1).optional(),
  }),
  z.object({
    error: z.string().min(1),
    error_description: z.string().optional(),
    interval: z.number().int().nonnegative().optional(),
  }),
])

export type TokenResponse = z.infer<typeof TokenResponseSchema>
