import { createOriginMatcher } from './cors'

describe('CORS origin matcher', () => {
  const isAllowed = createOriginMatcher([
    'http://localhost:5173',
    'https://*.fastos.com',
  ])

  it.each([
    'http://localhost:5173',
    'https://loja-a.fastos.com',
    'https://assistencia-tech.fastos.com',
    'HTTPS://Loja-A.FastOS.com',
  ])('should allow %s', (origin) => {
    expect(isAllowed(origin)).toBe(true)
  })

  it.each([
    ['another port', 'http://localhost:3000'],
    ['another site', 'https://evil.com'],
    ['the bare domain (not a subdomain)', 'https://fastos.com'],
    ['two subdomain levels', 'https://a.b.fastos.com'],
    ['a lookalike domain', 'https://evilfastos.com'],
    ['the domain as a prefix', 'https://loja.fastos.com.evil.com'],
    ['plain http on the wildcard', 'http://loja.fastos.com'],
    ['a port on the wildcard', 'https://loja.fastos.com:8443'],
  ])('should block %s (%s)', (_, origin) => {
    expect(isAllowed(origin)).toBe(false)
  })

  it('should block everything when no origin is configured', () => {
    expect(createOriginMatcher([])('http://localhost:5173')).toBe(false)
  })

  it('should treat dots in the configured host literally', () => {
    const matcher = createOriginMatcher(['https://*.fastos.com'])

    expect(matcher('https://loja.fastosXcom')).toBe(false)
  })
})
