import { z } from 'zod'

// `GET /api/have`, as the capture service answers it. Validated rather than
// trusted for the ordinary reason - it is a network response - and loosely,
// because the fields this extension does not read must not make an otherwise
// good answer unusable.
export const HaveResponseSchema = z.object({
  data: z.object({
    captured: z.boolean(),
    captured_at: z.string().nullable(),
    state: z.enum(['captured', 'ingested', 'needs-claude']).nullable(),
    clip_url: z.string().nullable(),
  }),
})
