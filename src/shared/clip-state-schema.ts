import { z } from 'zod'

export const ClipStateSchema = z.object({
  status: z.enum(['pending', 'processed', 'needs-claude']),
  updatedAt: z.string(),
  failure: z.string().nullable(),
  brainCommit: z.string().nullable(),
})

export type ClipState = z.infer<typeof ClipStateSchema>
