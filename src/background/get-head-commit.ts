import { githubFetch, type GithubContext } from './github-fetch'

export async function getHeadCommit(
  context: GithubContext,
  branch: string,
): Promise<{ commitSha: string; treeSha: string }> {
  const refResponse = await githubFetch(context, `/git/ref/heads/${branch}`)
  if (!refResponse.ok) throw new Error(`ref lookup failed: ${refResponse.status}`)
  const ref = (await refResponse.json()) as { object: { sha: string } }

  const commitResponse = await githubFetch(context, `/git/commits/${ref.object.sha}`)
  if (!commitResponse.ok) throw new Error(`commit lookup failed: ${commitResponse.status}`)
  const commit = (await commitResponse.json()) as { sha: string; tree: { sha: string } }

  return { commitSha: commit.sha, treeSha: commit.tree.sha }
}
