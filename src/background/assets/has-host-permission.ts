// Whether the extension may fetch from this origin. The options page grants
// every https host at once, but it is checked per asset origin anyway: the
// person can withdraw site access in Chrome without touching the option.
export async function hasHostPermission(origin: string): Promise<boolean> {
  return chrome.permissions.contains({ origins: [`${origin}/*`] })
}
