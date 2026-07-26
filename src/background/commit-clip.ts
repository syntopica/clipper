import type { ClipFiles } from '../shared/build-clip-files'
import { checkExistingClip } from './check-existing-clip'
import { ClipConflictError } from './clip-conflict-error'
import { createBlob } from './create-blob'
import { createCommit } from './create-commit'
import { createTree } from './create-tree'
import { getHeadCommit } from './get-head-commit'
import type { GithubContext } from './github-fetch'
import { NotFastForwardError } from './not-fast-forward-error'
import { updateRef } from './update-ref'

const MAX_ATTEMPTS = 3

export async function commitClip(
  context: GithubContext,
  input: { branch: string; clip: ClipFiles },
): Promise<{ commitSha: string; alreadyPresent: boolean }> {
  const existing = await checkExistingClip(context, {
    branch: input.branch,
    dirPath: input.clip.dirPath,
    clipId: input.clip.metadata.clip_id,
    contentSha256: input.clip.metadata.content_sha256,
  })
  if (existing === 'identical') return { commitSha: '', alreadyPresent: true }
  if (existing === 'conflict') throw new ClipConflictError(input.clip.dirPath)

  const entries = await Promise.all(
    Object.entries(input.clip.files).map(async ([path, content]) => ({
      path,
      sha: await createBlob(context, content),
    })),
  )

  const message = `Clip: ${input.clip.metadata.title}`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const head = await getHeadCommit(context, input.branch)
    const treeSha = await createTree(context, head.treeSha, entries)
    const commitSha = await createCommit(context, { message, treeSha, parentSha: head.commitSha })
    try {
      await updateRef(context, input.branch, commitSha)
      return { commitSha, alreadyPresent: false }
    } catch (error) {
      if (!(error instanceof NotFastForwardError) || attempt === MAX_ATTEMPTS) throw error
    }
  }

  throw new Error('unreachable')
}
