// A conservative starting list of hostnames that must never be committed to
// a repo, even as a "public" clip: mail, banking and admin surfaces. This is
// a starting point the user is expected to extend in their own fork, not an
// exhaustive list - see the README.
export const DENYLISTED_HOSTNAMES: readonly string[] = [
  'mail.google.com',
  'gmail.com',
  'outlook.live.com',
  'outlook.office.com',
  'outlook.office365.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'paypal.com',
  'americanexpress.com',
]
