export function getSelectionHtml(win: Window): string | null {
  const selection = win.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const container = win.document.createElement('div')
  for (let index = 0; index < selection.rangeCount; index += 1) {
    container.appendChild(selection.getRangeAt(index).cloneContents())
  }
  const html = container.innerHTML.trim()
  return html.length > 0 ? html : null
}
