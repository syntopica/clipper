import type { ClipAssets } from '../../shared/clip-assets'
import { prepareJobAssets } from '../assets/prepare-job-assets'
import type { CapturedPagePayload } from '../captured-page-payload'
import { putJob } from './put-job'
import type { QueuedClipJob } from './queued-clip-job'

// Run the asset step once per job. Its result is persisted as `ready` before
// anything is uploaded, then the job moves on to `uploading`; a job that
// already carries assets skips the step. Returns the job as now stored.
export async function ensureJobAssets(
  job: QueuedClipJob,
  prepare: (payload: CapturedPagePayload) => Promise<ClipAssets> = prepareJobAssets,
): Promise<QueuedClipJob & { assets: ClipAssets }> {
  if (job.assets != null) return { ...job, assets: job.assets }
  const assets = await prepare(job.payload)
  await putJob({ ...job, assets, state: 'ready' })
  const uploading = { ...job, assets, state: 'uploading' as const }
  await putJob(uploading)
  return uploading
}
