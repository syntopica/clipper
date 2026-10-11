// The one host permission image downloads need. Image hosts are only known
// after a page is extracted, too late for the permission prompt, which needs a
// user gesture - so the options page asks for every https host, once.
export const ALL_HTTPS_ORIGINS = 'https://*/*'
