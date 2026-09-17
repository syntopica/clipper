import { getSettings } from './get-settings'

// The client id of the GitHub App this install authorizes against. A setting
// rather than a constant: the previous build compiled one owner's app id in,
// so every other person had to fork the extension before they could sign in.
// Public by design either way - the device flow is a public-client flow and
// needs no client secret.
export async function githubAppClientId(): Promise<string> {
  const settings = await getSettings()
  if (!settings?.githubAppClientId) {
    throw new Error('no GitHub App client id is configured - open the options page')
  }
  return settings.githubAppClientId
}
