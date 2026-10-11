import { z } from 'zod'
import { HostnameEntrySchema } from './hostname-entry-schema'

export const SettingsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
  machineName: z.string().min(1),
  githubAppClientId: z.string().min(1).nullable().default(null),
  captureServiceOrigin: z.url().nullable().default(null),
  denylistedHostnames: z.array(HostnameEntrySchema).default([]),
  privateHostnames: z.array(HostnameEntrySchema).default([]),
})

export type Settings = z.infer<typeof SettingsSchema>
