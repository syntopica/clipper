import { resolveUrlOrNull } from './resolve-url-or-null'

// Every URL a `srcset` names, resolved, descriptors dropped.
export function srcsetUrls(srcset: string, baseUri: string): string[] {
  return srcset
    .split(',')
    .map((candidate) => resolveUrlOrNull(candidate.trim().split(/\s+/)[0] ?? null, baseUri))
    .filter((url): url is string => url !== null)
}
