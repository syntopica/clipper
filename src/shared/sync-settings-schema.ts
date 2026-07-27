import { z } from 'zod'

// The subset of the settings that is the same on every machine, and so is the
// only part that belongs in `chrome.storage.sync`. `machineName` deliberately
// stays out: syncing it would give every device the same `clipped_from` value
// and destroy the one thing the field exists to record.
export const SyncSettingsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
})

export type SyncSettings = z.infer<typeof SyncSettingsSchema>
