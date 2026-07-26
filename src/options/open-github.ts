const REVOKE_URL = 'https://github.com/settings/personal-access-tokens'

export function openGithub(): void {
  void chrome.tabs.create({ url: REVOKE_URL })
}
