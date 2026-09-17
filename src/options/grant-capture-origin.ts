// Ask for the host permission the capture origin needs. It is optional in the
// manifest because the origin is a setting: a manifest cannot name a host the
// person has not chosen yet, and asking for every https host up front is a
// permission prompt nobody should accept. Returns whether the extension may
// now talk to that origin.
export async function grantCaptureOrigin(origin: string): Promise<boolean> {
  return chrome.permissions.request({ origins: [`${origin}/*`] })
}
