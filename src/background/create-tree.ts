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
  if (!response.ok) throw new Error(`tree creation failed: ${response.status}`)
  return ((await response.json()) as { sha: string }).sha
}
