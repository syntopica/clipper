import { githubFetch, type GithubContext } from './github-fetch'

export type ExistingClipStatus = 'absent' | 'identical' | 'conflict'

export async function checkExistingClip(
  context: GithubContext,
  input: { branch: string; dirPath: string; clipId: string; contentSha256: string },
): Promise<ExistingClipStatus> {
  const response = await githubFetch(
    context,
    `/contents/${input.dirPath}/metadata.json?ref=${input.branch}`,
    { headers: { accept: 'application/vnd.github.raw+json' } },
  )
  if (response.status === 404) return 'absent'
  if (!response.ok) throw new Error(`existing clip lookup failed: ${response.status}`)

  const existing = (await response.json()) as { clip_id?: string; content_sha256?: string }
  const identical =
    existing.clip_id === input.clipId && existing.content_sha256 === input.contentSha256
  return identical ? 'identical' : 'conflict'
}
