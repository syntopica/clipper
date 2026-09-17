import { getSettings } from './get-settings'

// Where the capture service answers, when this install has one. A setting
// rather than a constant: the service is a Worker each person deploys, and the
// origin of one deployment is not a fact about the extension. Null means this
// install has no capture service, which is a supported configuration: clipping
// to GitHub does not need one.
export async function captureServiceOrigin(): Promise<string | null> {
  return (await getSettings())?.captureServiceOrigin ?? null
}
