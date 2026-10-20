import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  PORT: z.coerce.number().optional().default(3333),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
})

export type Env = z.infer<typeof envSchema>
