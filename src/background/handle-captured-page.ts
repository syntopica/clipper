import { buildClipFiles } from '../shared/build-clip-files'
import { getAccessToken } from '../shared/get-access-token'
import { getSettings } from '../shared/get-settings'
import { isDenylistedHostname } from '../shared/is-denylisted-hostname'
import { matchesHostnameList } from '../shared/matches-hostname-list'
import type { ClipJob } from './clip-job'
import { commitClip } from './commit-clip'

// Returns where the clip landed, which the caller needs for two things the
// commit itself does not do: telling the capture service the clip exists, and
// linking to it from the panel.
//
// The clip's id and timestamp come from the job, never from here: running the
// same job twice must target the same directory, so a retry after a lost
// response finds its own clip and stops as `identical`.
export async function handleCapturedPage(job: ClipJob): Promise<{ dirPath: string }> {
  const { payload } = job
  const hostname = new URL(payload.url).hostname
  if (isDenylistedHostname(hostname)) {
    throw new Error(`refusing to clip a denylisted host: ${hostname}`)
  }

  const settings = await getSettings()
  if (!settings) throw new Error('settings are incomplete - open the options page')
  if (isDenylistedHostname(hostname, settings.denylistedHostnames)) {
    throw new Error(`refusing to clip a host on your denylist: ${hostname}`)
  }
  const token = await getAccessToken()
  if (!token) throw new Error('not signed in to GitHub on this device - open the options page')

  const clip = await buildClipFiles({
    clipId: job.clipId,
    url: payload.url,
    markdown: payload.markdown,
    sourceHtml: payload.sourceHtml,
    snapshotMode: payload.snapshotMode,
    extractor: payload.extractor,
    siteExtractor: payload.siteExtractor,
    page: payload.page,
    sensitivity: matchesHostnameList(hostname, settings.privateHostnames) ? 'private' : 'public',
    clippedAt: job.clippedAt,
    clippedFrom: settings.machineName,
    extensionVersion: chrome.runtime.getManifest().version,
  })

  await commitClip(
    { token, owner: settings.owner, repo: settings.repo },
    { branch: settings.branch, clip },
  )

  return { dirPath: clip.dirPath }
}
