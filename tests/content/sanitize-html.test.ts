import { sanitizeHtml } from '../../src/content/sanitize-html'

test('removes scripts, iframes, forms and event attributes', () => {
  const dirty = `
    <div onclick="steal()">
      <script>fetch('/secret')</script>
      <iframe src="https://evil.example"></iframe>
      <form action="/pay"><input name="csrf" value="TOKEN-123" /></form>
      <p>kept</p>
    </div>`
  const clean = sanitizeHtml(dirty)
  expect(clean).toContain('kept')
  expect(clean).not.toContain('script')
  expect(clean).not.toContain('iframe')
  expect(clean).not.toContain('TOKEN-123')
  expect(clean).not.toContain('onclick')
})
