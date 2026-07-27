// An anchor whose visible text is its own url is content by construction:
// navigation, footers, share widgets and "read more" chrome never label
// themselves with a url. That makes this a safe signal for deciding which
// dropped links are worth recovering, without second-guessing the extractor
// about anything else.
//
// The trailing label before the first slash must be alphabetic so that
// "3.5/10" and "1.2/3" are not mistaken for hosts.
const URL_LIKE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i

export function isUrlLikeText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  return URL_LIKE.test(trimmed)
}
