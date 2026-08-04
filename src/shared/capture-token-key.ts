// `chrome.storage.local`, never `sync`. The capture token is minted per device
// so that revoking one device leaves the others alone, and syncing it would
// undo exactly that.
export const CAPTURE_TOKEN_KEY = 'captureToken'
