import type { ClipFiles } from '../shared/build-clip-files'
import { checkExistingClip } from './check-existing-clip'
import { ClipConflictError } from './clip-conflict-error'
import { createBlob } from './create-blob'
import { createCommit } from './create-commit'
import { createTree } from './create-tree'
import { getHeadCommit } from './get-head-commit'
import type { GithubContext } from './github-fetch'
import { NotFastForwardError } from './not-fast-forward-error'
import { DEFAULT_RETRY, retryTransientGithub, type RetryOptions } from './retry-transient-github'
import { updateRef } from './update-ref'

const MAX_ATTEMPTS = 3

export async function commitClip(
  context: GithubContext,
  input: { branch: string; clip: ClipFiles },
  retry: RetryOptions = DEFAULT_RETRY,
): Promise<{ commitSha: string | null; alreadyPresent: boolean }> {
  const existing = await checkExistingClip(context, {
    branch: input.branch,
    dirPath: input.clip.dirPath,
    clipId: input.clip.metadata.clip_id,
    contentSha256: input.clip.metadata.content_sha256,
  })
  if (existing === 'identical') return { commitSha: null, alreadyPresent: true }
  if (existing === 'conflict') throw new ClipConflictError(input.clip.dirPath)

  // One blob at a time, each retried with backoff. Firing them concurrently is
  // the burst pattern GitHub's secondary rate limits watch for, and four
  // requests in sequence cost well under a second.
  const entries: Array<{ path: string; sha: string }> = []
  for (const [path, content] of Object.entries(input.clip.files)) {
    entries.push({ path, sha: await retryTransientGithub(() => createBlob(context, content), retry) })
  }

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

  // Every loop iteration returns or throws; this only satisfies TypeScript's
  // control-flow analysis, which cannot prove the loop is exhaustive.
  throw new Error('unreachable')
}
