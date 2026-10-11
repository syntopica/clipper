// From the worker to the offscreen document, the only context with a DOM to
// parse an SVG in. `target` keeps every other listener out of it.
export interface SanitizeSvgRequest {
  target: 'offscreen'
  type: 'sanitize-svg'
  svg: string
}
