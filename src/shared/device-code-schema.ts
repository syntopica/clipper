import { z } from 'zod'

export const DeviceCodeSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.string().url(),
  expires_in: z.number().int().positive(),
  interval: z.number().int().nonnegative(),
})

export type DeviceCode = z.infer<typeof DeviceCodeSchema>
