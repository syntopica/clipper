import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { buildClipFiles } from '../shared/build-clip-files'
import { getAccessToken } from '../shared/get-access-token'
import { getSettings } from '../shared/get-settings'
import { isDenylistedHostname } from '../shared/is-denylisted-hostname'
import { newClipId } from '../shared/new-clip-id'
import { commitClip } from './commit-clip'

export interface CapturedPagePayload {
  type: 'clip-captured'
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized'
  extractor: Extractor
  siteExtractor: boolean
  page: PageMetadata
}

// Returns where the clip landed, which the caller needs for two things the
// commit itself does not do: telling the capture service the clip exists, and
// linking to it from the panel.
export async function handleCapturedPage(
  payload: CapturedPagePayload,
): Promise<{ dirPath: string }> {
  const hostname = new URL(payload.url).hostname
  if (isDenylistedHostname(hostname)) {
    throw new Error(`refusing to clip a denylisted host: ${hostname}`)
  }

  const settings = await getSettings()
  if (!settings) throw new Error('settings are incomplete - open the options page')
  const token = await getAccessToken()
  if (!token) throw new Error('not signed in to GitHub on this device - open the options page')

  const clip = await buildClipFiles({
    clipId: newClipId(),
    url: payload.url,
    markdown: payload.markdown,
    sourceHtml: payload.sourceHtml,
    snapshotMode: payload.snapshotMode,
    extractor: payload.extractor,
    siteExtractor: payload.siteExtractor,
    page: payload.page,
    clippedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    clippedFrom: settings.machineName,
    extensionVersion: chrome.runtime.getManifest().version,
  })

  await commitClip(
    { token, owner: settings.owner, repo: settings.repo },
    { branch: settings.branch, clip },
  )

  return { dirPath: clip.dirPath }
}
