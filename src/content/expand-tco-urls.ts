interface UrlEntity {
  url?: unknown
  expanded_url?: unknown
}

// Tweet text arrives with every link collapsed to a t.co redirect; the real
// targets travel alongside in the entity lists. Swap them back so the clip
// carries links that still mean something when t.co eventually breaks.
export function expandTcoUrls(text: string, entityLists: unknown[]): string {
  let expanded = text
  for (const list of entityLists) {
    if (!Array.isArray(list)) continue
    for (const entity of list as UrlEntity[]) {
      if (typeof entity?.url !== 'string' || typeof entity.expanded_url !== 'string') continue
      expanded = expanded.split(entity.url).join(entity.expanded_url)
    }
  }
  return expanded
}
