import { GithubRequestError } from './github-request-error'
import { githubFetch, type GithubContext } from './github-fetch'

export async function createTree(
  context: GithubContext,
  baseTreeSha: string,
  entries: Array<{ path: string; sha: string }>,
): Promise<string> {
  const response = await githubFetch(context, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: entries.map((entry) => ({ path: entry.path, mode: '100644', type: 'blob', sha: entry.sha })),
    }),
  })
  if (!response.ok) throw new GithubRequestError('tree creation', response)
  return ((await response.json()) as { sha: string }).sha
}
