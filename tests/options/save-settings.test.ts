import { readFileSync } from 'node:fs'
import { installChromeMock } from '../chrome-mock'
import { saveSettings } from '../../src/options/save-settings'

function renderOptionsPage(): void {
  const html = readFileSync('src/options/options.html', 'utf8')
  document.body.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '')
  const values: Record<string, string> = {
    owner: 'o',
    repo: 'r',
    branch: 'main',
    machineName: 'm',
    captureToken: '',
  }
  for (const [id, value] of Object.entries(values)) {
    ;(document.getElementById(id) as HTMLInputElement).value = value
  }
}

test('saves both hostname lists, normalised, to sync storage', async () => {
  const stores = installChromeMock()
  renderOptionsPage()
  ;(document.getElementById('denylistedHostnames') as HTMLTextAreaElement).value = 'Bank.Example\n'
  ;(document.getElementById('privateHostnames') as HTMLTextAreaElement).value = 'intranet.example\n\n'
  await saveSettings()
  expect(stores.sync.data.denylistedHostnames).toEqual(['bank.example'])
  expect(stores.sync.data.privateHostnames).toEqual(['intranet.example'])
  expect(document.getElementById('status')?.textContent).toBe('Saved.')
})

test('an entry that is not a bare hostname saves nothing and says which', async () => {
  const stores = installChromeMock()
  renderOptionsPage()
  ;(document.getElementById('denylistedHostnames') as HTMLTextAreaElement).value = 'https://bank.example/'
  await saveSettings()
  expect(stores.sync.data).toEqual({})
  expect(document.getElementById('status')?.textContent).toContain('https://bank.example/')
})
