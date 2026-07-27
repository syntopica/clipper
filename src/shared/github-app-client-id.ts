// The client id of the `brain clipper` GitHub App. Public by design: the device
// flow is a public-client flow and needs no client secret, so shipping this in
// the extension bundle leaks nothing. Empty until the app exists on GitHub;
// `signIn` refuses to start rather than sending a request that would 404.
export const GITHUB_APP_CLIENT_ID = ''
