// A Chrome extension cannot read the host's name: `getPlatformInfo` exposes os
// and architecture only, and `enterprise.deviceAttributes.getDeviceHostname` is
// ChromeOS-with-policy. So the default is descriptive rather than true - platform
// plus a random suffix that keeps two Macs distinguishable - and the options page
// leaves it editable.
export async function defaultMachineName(): Promise<string> {
  const { os, arch } = await chrome.runtime.getPlatformInfo()
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `${os}-${arch}-${suffix}`
}
