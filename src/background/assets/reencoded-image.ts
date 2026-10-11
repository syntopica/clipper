// A raster image after the WebP pass, and whether its long edge was cut down
// to the cap - which decides whether the original may still be kept instead.
export interface ReencodedImage {
  blob: Blob
  resized: boolean
}
