import { hours, minutes, ThrottlerModuleOptions } from '@nestjs/throttler'

// Counted per client IP (see TRUST_PROXY_HOPS in main.ts)
export const LOGIN_RATE_LIMIT = { default: { limit: 10, ttl: minutes(1) } }
export const SIGNUP_RATE_LIMIT = { default: { limit: 10, ttl: hours(1) } }

export const THROTTLER_OPTIONS: ThrottlerModuleOptions = [
  LOGIN_RATE_LIMIT.default,
]
