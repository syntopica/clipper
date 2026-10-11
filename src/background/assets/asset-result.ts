// Every asset step either yields its value or a reason a person can read in
// `asset_failures`. Failing an asset never fails the clip: the caller keeps the
// remote URL in the markdown and records the reason.
export type AssetResult<T> = { ok: true; value: T } | { ok: false; reason: string }
