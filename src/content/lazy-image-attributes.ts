// Where lazy-loading libraries park an image's real URL while `src` holds a
// placeholder. Read before sanitising, which drops every `data-*` attribute.
export const LAZY_SRC_ATTRIBUTES = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'data-url']
