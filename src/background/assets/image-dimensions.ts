// The largest canvas an image's container declares, and how many frames it
// holds - one for every format but an animated GIF.
export interface ImageDimensions {
  width: number
  height: number
  frames: number
}
