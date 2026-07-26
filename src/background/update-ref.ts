import { githubFetch, type GithubContext } from './github-fetch'
import { NotFastForwardError } from './not-fast-forward-error'

export async function updateRef(
  context: GithubContext,
  branch: string,
  commitSha: string,
): Promise<void> {
  const response = await githubFetch(context, `/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha, force: false }),
  })
  if (response.ok) return
  if (response.status === 409 || response.status === 422) throw new NotFastForwardError()
  throw new Error(`ref update failed: ${response.status}`)
}
