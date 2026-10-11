import anyAscii from 'any-ascii'

// Transliterate first, so a CJK, Cyrillic or Greek title still names its
// directory with something a person can read - `Москва` becomes `moskva`, not
// nothing. Latin diacritics were already handled by NFKD; any-ascii covers
// them too, and the NFKD pass stays for anything it leaves combined.
export function slugify(input: string): string {
  return anyAscii(input)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
