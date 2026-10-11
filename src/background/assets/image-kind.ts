// What an image's own bytes say it is. `other` is something the browser may
// still decode - a BMP, an icon - and it is only ever stored re-encoded.
export type ImageKind = 'svg' | 'gif' | 'png' | 'jpeg' | 'webp' | 'avif' | 'other'
