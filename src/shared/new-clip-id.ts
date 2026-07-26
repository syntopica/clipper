import { ulid } from 'ulid'

export function newClipId(): string {
  return ulid()
}
