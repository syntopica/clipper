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

test.each([
  ['a quoted url hiding its closing paren', `<rect fill="url('https://evil.example/a)b')"/>`],
  ['a CSS-escaped url', '<rect style="fill: u\\72l(https://evil.example/x)"/>'],
  ['image-set with a bare string', `<rect style="fill: image-set('https://evil.example/x' 1x)"/>`],
  ['an uppercase URL function', '<rect fill="URL( https://evil.example/x )"/>'],
  ['a javascript: link', '<a href="javascript:alert(1)"><rect/></a>'],
  ['a data: image', '<image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="/>'],
  ['an xlink:href to another origin', '<a xlink:href="https://evil.example/"><rect/></a>'],
])('%s is removed', (_name, inner) => {
  const clean = sanitizeSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${inner}<circle r="1"/></svg>`,
  )
  expect(clean).toContain('<circle')
  expect(clean).not.toMatch(/evil\.example|javascript:|data:|\\72/)
})

test('event handlers in any case, <use> and <foreignObject> do not survive', () => {
  const clean = sanitizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect ONCLICK="alert(1)" onMouseOver="alert(2)"/>' +
      '<use href="https://evil.example/s.svg#a"/><foreignObject><iframe src="https://evil.example"/></foreignObject></svg>',
  )
  expect(clean).toContain('<rect')
  expect(clean).not.toMatch(/onclick|onmouseover|<use|foreignObject|iframe|evil\.example/i)
})

test('an internal DTD subset is refused before the XML parse can expand it', () => {
  const laughs =
    '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY a "lol"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>' +
    '<svg xmlns="http://www.w3.org/2000/svg"><text>&b;</text></svg>'
  expect(sanitizeSvg(laughs)).toBeNull()
})

test('an external DTD reference, as editors write it, is still accepted', () => {
  const clean = sanitizeSvg(
    '<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
  )
  expect(clean).toContain('<rect')
})
