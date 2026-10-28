import { envSchema } from './env'

const requiredEnv = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/fastos',
  JWT_PRIVATE_KEY: 'private-key',
  JWT_PUBLIC_KEY: 'public-key',
}

describe('Environment variables', () => {
  it('should default to no CORS origins, Swagger off and new tenants waiting for approval', () => {
    const env = envSchema.parse(requiredEnv)

    expect(env.CORS_ORIGINS).toEqual([])
    expect(env.SWAGGER_ENABLED).toBe(false)
    expect(env.TENANT_AUTO_APPROVAL).toBe(false)
  })

  it('should read a comma-separated list of CORS origins', () => {
    const env = envSchema.parse({
      ...requiredEnv,
      CORS_ORIGINS: ' http://localhost:5173 ,https://*.fastos.com,, ',
    })

    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'https://*.fastos.com',
    ])
  })

  it.each([
    ['a trailing slash', 'https://app.fastos.com/'],
    ['a path', 'https://app.fastos.com/login'],
    ['no scheme', 'app.fastos.com'],
    ['a bare wildcard', '*'],
    ['a wildcard with no domain', 'https://*'],
    ['a wildcard in the middle', 'https://loja.*.com'],
  ])('should reject a CORS origin with %s', (_, origin) => {
    const result = envSchema.safeParse({ ...requiredEnv, CORS_ORIGINS: origin })

    expect(result.success).toBe(false)
  })

  it.each([
    ['true', true],
    ['false', false],
  ])('should read SWAGGER_ENABLED=%s', (value, expected) => {
    const env = envSchema.parse({ ...requiredEnv, SWAGGER_ENABLED: value })

    expect(env.SWAGGER_ENABLED).toBe(expected)
  })

  it('should reject an unclear SWAGGER_ENABLED value', () => {
    const result = envSchema.safeParse({
      ...requiredEnv,
      SWAGGER_ENABLED: 'yes',
    })

    expect(result.success).toBe(false)
  })
})
