import type { StoredAsset } from './stored-asset'

// What the asset step produced for one clip: the files to commit, and one
// `<url>: <reason>` line per image that keeps its remote URL instead.
export interface ClipAssets {
  files: StoredAsset[]
  failures: string[]
}
