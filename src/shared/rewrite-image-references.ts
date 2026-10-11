import { escapeRegExp } from './escape-reg-exp'

// Point every markdown image whose URL was stored at its committed file, as a
// path relative to `index.md`. Only image syntax is touched - a link to the
// same URL stays a link to the page's copy - and a URL with no stored file
// keeps its remote form. The URL is matched literally rather than by a
// destination pattern because image URLs carry parentheses (Wikimedia's do).
export function rewriteImageReferences(markdown: string, paths: ReadonlyMap<string, string>): string {
  let rewritten = markdown
  for (const [url, path] of paths) {
    const reference = new RegExp(`(!\\[[^\\]\\n]*\\]\\()${escapeRegExp(url)}(?=\\)|\\s+")`, 'g')
    rewritten = rewritten.replace(reference, (_match, prefix: string) => `${prefix}${path}`)
  }
  return rewritten
}
