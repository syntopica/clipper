import { GithubRequestError } from './github-request-error'
import { githubFetch, type GithubContext } from './github-fetch'

// Text files go up as utf-8; an image goes up as base64, the only form the
// blob API accepts binary content in.
export async function createBlob(
  context: GithubContext,
  content: string,
  encoding: 'utf-8' | 'base64' = 'utf-8',
): Promise<string> {
  const response = await githubFetch(context, '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content, encoding }),
  })
  if (!response.ok) throw new GithubRequestError('blob creation', response)
  return ((await response.json()) as { sha: string }).sha
}
