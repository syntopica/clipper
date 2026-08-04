import { resolveClipStatus } from '../background/resolve-clip-status'
import { activeTab } from './active-tab'
import { renderStatus } from './render-status'
import { requestRecapture } from './request-recapture'

void (async () => {
  const tab = await activeTab()
  if (tab?.url === undefined) return
  renderStatus(tab.title ?? tab.url, await resolveClipStatus(tab.url))
  document.getElementById('recapture')?.addEventListener('click', () => {
    if (tab.id !== undefined) void requestRecapture(tab.id)
  })
})()
