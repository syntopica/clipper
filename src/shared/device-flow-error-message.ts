// The device-flow error codes that end the flow. `authorization_pending` and
// `slow_down` are absent on purpose: they are polling signals, not failures, and
// are handled by the poll loop before this map is consulted.
const MESSAGES: Record<string, string> = {
  access_denied: 'You cancelled the authorization on GitHub.',
  expired_token: 'The code expired before it was entered on GitHub. Start again.',
  device_flow_disabled: 'The device flow is not enabled on the GitHub App.',
  incorrect_client_credentials: 'The GitHub App client id in this build is wrong.',
  incorrect_device_code: 'GitHub rejected the device code. Start again.',
  unsupported_grant_type: 'GitHub rejected the grant type.',
}

export function deviceFlowErrorMessage(code: string, description?: string): string {
  return MESSAGES[code] ?? description ?? `GitHub refused the authorization: ${code}`
}
