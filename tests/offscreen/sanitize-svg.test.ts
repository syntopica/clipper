import { sanitizeSvg } from '../../src/offscreen/sanitize-svg'

test('scripts, event handlers, styles and foreign objects are removed; drawing stays', () => {
  const clean = sanitizeSvg(
    '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)">' +
      '<script>alert(2)</script><style>@import url(https://evil.example/x.css);</style>' +
      '<foreignObject><div>x</div></foreignObject>' +
      '<rect width="10" height="10" fill="red" onclick="alert(3)"/></svg>',
  )
  expect(clean).not.toBeNull()
  expect(clean).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(clean).toContain('viewBox="0 0 10 10"')
  expect(clean).toContain('<rect')
  for (const gone of ['script', 'onload', 'onclick', 'style', 'foreignObject', 'evil.example']) {
    expect(clean).not.toContain(gone)
  }
})

test('external references are cut, fragment references kept', () => {
  const clean = sanitizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<defs><linearGradient id="g"/><linearGradient id="h" href="#g"/>' +
      '<linearGradient id="i" xlink:href="https://track.example/sprite.svg#a"/></defs>' +
      '<image href="https://track.example/pixel.png"/>' +
      '<rect fill="url(#g)"/><circle fill="url(https://track.example/f.svg#x)"/></svg>',
  )
  expect(clean).toContain('href="#g"')
  expect(clean).toContain('fill="url(#g)"')
  expect(clean).not.toContain('track.example')
})

test('something that is not an SVG document is refused', () => {
  expect(sanitizeSvg('<html><body><svg></svg></body></html>')).toBeNull()
  expect(sanitizeSvg('{"secret": true}')).toBeNull()
  expect(sanitizeSvg('<svg><unclosed></svg>')).toBeNull()
})
