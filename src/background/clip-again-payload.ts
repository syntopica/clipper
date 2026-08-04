// Sent by the panel, never by a page: the panel is the only surface that offers
// a second capture of a URL already in the store, and it carries the tab id
// because a popup is not a tab and the worker cannot infer one from the sender.
export interface ClipAgainPayload {
  type: 'clip-again'
  tabId: number
}
