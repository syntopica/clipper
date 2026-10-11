import { SyncSettingsSchema } from './sync-settings-schema'

// The user's additions to the denylist on their own, for callers that must
// honour them without needing the rest of the settings. Null when the stored
// value is malformed: a caller cannot tell which hosts it was meant to block,
// so it must treat every host as blocked.
export async function getUserDenylist(): Promise<string[] | null> {
  const stored = await chrome.storage.sync.get(['denylistedHostnames'])
  const parsed = SyncSettingsSchema.shape.denylistedHostnames.safeParse(stored.denylistedHostnames)
  return parsed.success ? parsed.data : null
}
