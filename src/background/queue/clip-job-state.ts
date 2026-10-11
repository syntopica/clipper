// The phase 2 subset of the design's state machine. `fetching-assets` and
// `ready` belong to phase 3, which has no asset pipeline to drive them yet.
export type ClipJobState =
  | 'captured'
  | 'uploading'
  | 'transient-failure'
  | 'permanent-failure'
