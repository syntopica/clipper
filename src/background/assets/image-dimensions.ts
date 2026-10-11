// The largest canvas an image's container declares, and the pixels all its
// frames cover together - the canvas area for a still image, the sum of the
// frame areas for an animated GIF.
export interface ImageDimensions {
  width: number
  height: number
  totalPixels: number
}
