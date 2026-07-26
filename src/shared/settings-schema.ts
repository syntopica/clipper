import { z } from 'zod'

export const SettingsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
  machineName: z.string().min(1),
})

export type Settings = z.infer<typeof SettingsSchema>
