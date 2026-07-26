import { githubFetch, type GithubContext } from './github-fetch'

export async function createCommit(
  context: GithubContext,
  input: { message: string; treeSha: string; parentSha: string },
): Promise<string> {
  const response = await githubFetch(context, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: input.message, tree: input.treeSha, parents: [input.parentSha] }),
  })
  if (!response.ok) throw new Error(`commit creation failed: ${response.status}`)
  return ((await response.json()) as { sha: string }).sha
}
