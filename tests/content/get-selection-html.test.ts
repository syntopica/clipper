import { getSelectionHtml } from '../../src/content/get-selection-html'

test('returns null when nothing is selected', () => {
  document.body.innerHTML = '<p id="a">hello <b>world</b></p>'
  window.getSelection()?.removeAllRanges()
  expect(getSelectionHtml(window)).toBeNull()
})

test('returns the selected range as html', () => {
  document.body.innerHTML = '<p id="a">hello <b>world</b></p>'
  const range = document.createRange()
  range.selectNodeContents(document.getElementById('a')!)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)

  expect(getSelectionHtml(window)).toBe('hello <b>world</b>')
})
