import { z } from 'zod'
import { CORS_ORIGIN_PATTERN } from '@/infra/http/cors'

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  PORT: z.coerce.number().optional().default(3333),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(
      z.array(
        z
          .string()
          .regex(
            CORS_ORIGIN_PATTERN,
            'must be an origin like https://app.example.com or https://*.example.com, with no path or trailing slash',
          ),
      ),
    ),
  SWAGGER_ENABLED: booleanFromString,
})

export type Env = z.infer<typeof envSchema>
