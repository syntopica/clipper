// Authorized GitHub Apps, where the user-to-server grant this extension holds can
// actually be revoked. Deleting the local credential does not revoke anything.
const REVOKE_URL = 'https://github.com/settings/apps/authorizations'

export function openGithub(): void {
  void chrome.tabs.create({ url: REVOKE_URL })
}
