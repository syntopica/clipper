import { z } from 'zod'

// One entry of a user hostname list: a bare, lower-case hostname - no scheme,
// path, port or wildcard. It matches itself and every subdomain, the same rule
// the built-in denylist uses.
export const HostnameEntrySchema = z
  .string()
  .regex(/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/)
