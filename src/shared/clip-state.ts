// How far the clip for a URL got, as the capture service reports it, plus the
// one value the service does not have a word for: `absent`, meaning no capture
// exists. Every failure to ask resolves to `absent` too - see fetchClipStatus.
export type ClipState = 'absent' | 'captured' | 'ingested' | 'needs-claude'
