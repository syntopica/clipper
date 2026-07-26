import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { buildClipFiles } from '../shared/build-clip-files'
import { getSettings } from '../shared/get-settings'
import { getToken } from '../shared/get-token'
import { newClipId } from '../shared/new-clip-id'
import { commitClip } from './commit-clip'

export interface CapturedPagePayload {
  type: 'clip-captured'
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized'
  extractor: Extractor
  page: PageMetadata
}

export async function handleCapturedPage(payload: CapturedPagePayload): Promise<void> {
  const settings = await getSettings()
  if (!settings) throw new Error('settings are incomplete - open the options page')
  const token = await getToken()
  if (!token) throw new Error('no GitHub token on this device - open the options page')

  const clip = await buildClipFiles({
    clipId: newClipId(),
    url: payload.url,
    markdown: payload.markdown,
    sourceHtml: payload.sourceHtml,
    snapshotMode: payload.snapshotMode,
    extractor: payload.extractor,
    page: payload.page,
    clippedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    clippedFrom: settings.machineName,
    extensionVersion: chrome.runtime.getManifest().version,
  })

  await commitClip(
    { token, owner: settings.owner, repo: settings.repo },
    { branch: settings.branch, clip },
  )
}
