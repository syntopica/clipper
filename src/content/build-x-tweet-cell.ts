import type { XTweet } from './x-tweet'

/**
 * A minimal timeline cell for a tweet X never rendered (virtualized out of the
 * DOM or never scrolled to). The structure mirrors exactly what Defuddle's
 * twitter extractor reads: a `cellInnerDiv` holding an `article` with a
 * `User-Name` block (display-name link, @handle link, timestamp permalink) and
 * a `tweetText` block. Newlines in the text survive serialization and become
 * paragraphs downstream.
 */
export function buildXTweetCell(doc: Document, tweet: XTweet): Element {
  const cell = doc.createElement('div')
  cell.setAttribute('data-testid', 'cellInnerDiv')

  const article = doc.createElement('article')
  article.setAttribute('data-testid', 'tweet')
  cell.appendChild(article)

  const userName = doc.createElement('div')
  userName.setAttribute('data-testid', 'User-Name')
  article.appendChild(userName)

  const handle = tweet.authorHandle ?? ''
  if (tweet.authorName) {
    const nameLink = doc.createElement('a')
    nameLink.setAttribute('href', `/${handle}`)
    nameLink.textContent = tweet.authorName
    userName.appendChild(nameLink)
  }
  if (handle) {
    const handleLink = doc.createElement('a')
    handleLink.setAttribute('href', `/${handle}`)
    handleLink.textContent = `@${handle}`
    userName.appendChild(handleLink)
  }

  const permalink = doc.createElement('a')
  permalink.setAttribute('href', `/${handle}/status/${tweet.id}`)
  const time = doc.createElement('time')
  if (tweet.createdAt) time.setAttribute('datetime', tweet.createdAt)
  time.textContent = tweet.createdAt?.slice(0, 10) ?? ''
  permalink.appendChild(time)
  userName.appendChild(permalink)

  const text = doc.createElement('div')
  text.setAttribute('data-testid', 'tweetText')
  text.textContent = tweet.text
  article.appendChild(text)

  return cell
}
