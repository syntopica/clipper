import { GithubRequestError } from './github-request-error'
import { githubFetch, type GithubContext } from './github-fetch'

export async function createBlob(context: GithubContext, content: string): Promise<string> {
  const response = await githubFetch(context, '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content, encoding: 'utf-8' }),
  })
  if (!response.ok) throw new GithubRequestError('blob creation', response)
  return ((await response.json()) as { sha: string }).sha
}
