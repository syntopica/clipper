// One image file committed with a clip, under `assets/<fileName>`. `urls` is
// every page URL whose bytes turned out identical: they all point at this file
// in the markdown. The bytes are an ArrayBuffer because the job, assets
// included, is persisted in IndexedDB, which clones one natively.
export interface StoredAsset {
  urls: string[]
  fileName: string
  bytes: ArrayBuffer
}
