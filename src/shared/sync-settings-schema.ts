import { z } from 'zod'

// The subset of the settings that is the same on every machine, and so is the
// only part that belongs in `chrome.storage.sync`. `machineName` deliberately
// stays out: syncing it would give every device the same `clipped_from` value
// and destroy the one thing the field exists to record.
export const SyncSettingsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
  // The GitHub App and the capture service this install talks to. No default:
  // the previous build compiled one owner's app id and one owner's capture
  // origin into the extension, so anyone else had to fork it to use it at all.
  // Null means "not configured", and the feature that needs it says so.
  githubAppClientId: z.string().min(1).nullable().default(null),
  captureServiceOrigin: z.url().nullable().default(null),
})

export type SyncSettings = z.infer<typeof SyncSettingsSchema>
