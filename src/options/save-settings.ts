import { setCaptureToken } from '../shared/set-capture-token'
import { grantCaptureOrigin } from './grant-capture-origin'
import { setSettings } from '../shared/set-settings'
import { SettingsSchema } from '../shared/settings-schema'
import { field } from './field'
import { say } from './say'
import { textArea } from './text-area'
import { parseHostnameList } from '../shared/parse-hostname-list'

export async function saveSettings(): Promise<void> {
  const denylisted = parseHostnameList(textArea('denylistedHostnames').value)
  const privateHosts = parseHostnameList(textArea('privateHostnames').value)
  for (const list of [denylisted, privateHosts]) {
    if (!list.ok) {
      return say(`Saved nothing: not a bare hostname: ${list.invalid.join(', ')}`)
    }
  }
  const parsed = SettingsSchema.safeParse({
    owner: field('owner').value.trim(),
    repo: field('repo').value.trim(),
    branch: field('branch').value.trim(),
    machineName: field('machineName').value.trim(),
    githubAppClientId: field('githubAppClientId').value.trim() || null,
    captureServiceOrigin: field('captureServiceOrigin').value.trim() || null,
    denylistedHostnames: denylisted.ok ? denylisted.hostnames : [],
    privateHostnames: privateHosts.ok ? privateHosts.hostnames : [],
  })
  if (!parsed.success) {
    return say(
      'Owner, repo, branch and machine name are required; the capture origin must be a URL.',
    )
  }
  if (parsed.data.captureServiceOrigin !== null) {
    const granted = await grantCaptureOrigin(parsed.data.captureServiceOrigin)
    if (!granted) {
      return say(
        'Saved nothing: without permission for that origin the capture service is unreachable.',
      )
    }
  }
  await setSettings(parsed.data)
  // An empty capture token is valid and means the toolbar icon stays grey: the
  // extension clips exactly as it did before the icon knew anything.
  await setCaptureToken(field('captureToken').value.trim())
  say('Saved.')
}
