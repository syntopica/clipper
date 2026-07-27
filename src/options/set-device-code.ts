import type { DeviceCode } from '../shared/device-code-schema'
import { element } from './element'

export function setDeviceCode(deviceCode: DeviceCode | null): void {
  element('deviceCode').hidden = deviceCode === null
  element('userCode').textContent = deviceCode?.user_code ?? ''
  const link = element('verificationLink') as HTMLAnchorElement
  link.href = deviceCode?.verification_uri ?? '#'
}
