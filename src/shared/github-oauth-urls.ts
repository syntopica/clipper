// Device flow endpoints live on github.com, not api.github.com, so they need
// their own host permission in the manifest.
export const GITHUB_OAUTH_URLS = {
  deviceCode: 'https://github.com/login/device/code',
  accessToken: 'https://github.com/login/oauth/access_token',
} as const
