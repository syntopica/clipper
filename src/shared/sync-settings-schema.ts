import { z } from 'zod'
import { HostnameEntrySchema } from './hostname-entry-schema'

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
  // Hosts the user adds to the built-in denylist: never clipped, never named
  // to the capture service. It can only add - the built-in list and the
  // loopback, private and `.local` rules always apply. Synced, because a host
  // that must never leave one machine must not leave the others either.
  denylistedHostnames: z.array(HostnameEntrySchema).default([]),
  // Hosts whose clips are marked `sensitivity: private`, which the ingest side
  // routes to manual review instead of synthesis. Separate from the denylist:
  // a private host is clipped, a denylisted one is not.
  privateHostnames: z.array(HostnameEntrySchema).default([]),
})

export type SyncSettings = z.infer<typeof SyncSettingsSchema>
