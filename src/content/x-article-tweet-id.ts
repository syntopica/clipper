// The tweet id of a rendered article, read from its timestamp permalink
// (`<a href=".../status/<id>"><time>`). The focal tweet on a status page
// renders its timestamp without a link and so returns null - callers fall
// back to the id in the page url for that one.
export function xArticleTweetId(article: Element): string | null {
  for (const time of article.querySelectorAll('time[datetime]')) {
    const href = time.closest('a')?.getAttribute('href') ?? ''
    const match = href.match(/\/status\/(\d+)/)
    if (match?.[1]) return match[1]
  }
  return null
}
