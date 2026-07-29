// Marker for the postMessage relay between the MAIN-world network hook and the
// isolated-world collector on X pages. Any page script can forge a message with
// this marker; the worst that buys is planted text in a clip the user reviews,
// so the marker only needs to be distinctive, not secret.
export const X_GRAPHQL_MESSAGE_SOURCE = 'brain-clipper:x-graphql'
