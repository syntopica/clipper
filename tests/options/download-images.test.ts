import { installChromeMock, type ChromeMock } from '../chrome-mock'
import { toggleDownloadImages } from '../../src/options/toggle-download-images'

let chromeMock: ChromeMock

beforeEach(() => {
  chromeMock = installChromeMock()
  document.body.innerHTML = '<input id="downloadImages" type="checkbox"><p id="status"></p>'
})

const checkbox = () => document.getElementById('downloadImages') as HTMLInputElement

test('switching images on asks for every https host and remembers the choice', async () => {
  checkbox().checked = true
  await toggleDownloadImages()
  expect(chromeMock.grantedOrigins.has('https://*/*')).toBe(true)
  expect(chromeMock.local.data.downloadImages).toBe(true)
})

test('a refused permission leaves images off', async () => {
  chromeMock.permissionAnswer.grant = false
  checkbox().checked = true
  await toggleDownloadImages()
  expect(checkbox().checked).toBe(false)
  expect(chromeMock.local.data.downloadImages).toBe(false)
})

test('switching images off stops the downloads', async () => {
  chromeMock.local.data.downloadImages = true
  checkbox().checked = false
  await toggleDownloadImages()
  expect(chromeMock.local.data.downloadImages).toBe(false)
})
