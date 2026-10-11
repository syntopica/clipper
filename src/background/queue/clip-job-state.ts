// The design's state machine, less `committed`: a committed job is deleted.
// `fetching-assets` holds while images are fetched and prepared, `ready` once
// they are persisted with the job, so a retry commits the very same files.
export type ClipJobState =
  | 'captured'
  | 'fetching-assets'
  | 'ready'
  | 'uploading'
  | 'transient-failure'
  | 'permanent-failure'
