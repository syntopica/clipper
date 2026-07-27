import { fetchGithubLogin } from '../shared/fetch-github-login'
import { GITHUB_APP_CLIENT_ID } from '../shared/github-app-client-id'
import { pollForCredential } from '../shared/poll-for-credential'
import { requestDeviceCode } from '../shared/request-device-code'
import { setCredential } from '../shared/set-credential'
import { element } from './element'
import { renderAuth } from './render-auth'
import { say } from './say'
import { setDeviceCode } from './set-device-code'

// The poll runs here rather than in the service worker because a worker can be
// terminated between polls; an open options tab survives the whole exchange.
export async function signIn(): Promise<void> {
  if (!GITHUB_APP_CLIENT_ID) {
    return say('This build has no GitHub App client id compiled in - see README.')
  }

  const button = element('signIn') as HTMLButtonElement
  button.disabled = true
  try {
    say('Asking GitHub for a code...')
    const deviceCode = await requestDeviceCode()
    setDeviceCode(deviceCode)
    await chrome.tabs.create({ url: deviceCode.verification_uri })
    say('Waiting for you to authorize on GitHub...')

    const credential = await pollForCredential(deviceCode)
    const login = await fetchGithubLogin(credential.accessToken)
    await setCredential({ ...credential, login })
    setDeviceCode(null)
    await renderAuth()
    say('Signed in.')
  } catch (error) {
    setDeviceCode(null)
    say(error instanceof Error ? error.message : String(error))
  } finally {
    button.disabled = false
  }
}
