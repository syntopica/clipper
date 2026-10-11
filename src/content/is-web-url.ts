// An http(s) URL - something that could be fetched as an asset. `data:` and
// `blob:` images are already inline or unreachable from the worker.
export function isWebUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}
