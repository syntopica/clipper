export function resolveUrlOrNull(value: string | null, baseUri: string): string | null {
  if (!value) return null
  try {
    return new URL(value.trim(), baseUri).href
  } catch {
    return null
  }
}
