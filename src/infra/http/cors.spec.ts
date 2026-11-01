import { createOriginMatcher } from './cors'

describe('CORS origin matcher', () => {
  const isAllowed = createOriginMatcher([
    'http://localhost:5173',
    'https://*.consertiva.com.br',
  ])

  it.each([
    'http://localhost:5173',
    'https://loja-a.consertiva.com.br',
    'https://assistencia-tech.consertiva.com.br',
    'HTTPS://Loja-A.Consertiva.COM.BR',
  ])('should allow %s', (origin) => {
    expect(isAllowed(origin)).toBe(true)
  })

  it.each([
    ['another port', 'http://localhost:3000'],
    ['another site', 'https://evil.com'],
    ['the bare domain (not a subdomain)', 'https://consertiva.com.br'],
    ['two subdomain levels', 'https://a.b.consertiva.com.br'],
    ['a lookalike domain', 'https://evilconsertiva.com.br'],
    ['the domain as a prefix', 'https://loja.consertiva.com.br.evil.com'],
    ['plain http on the wildcard', 'http://loja.consertiva.com.br'],
    ['a port on the wildcard', 'https://loja.consertiva.com.br:8443'],
  ])('should block %s (%s)', (_, origin) => {
    expect(isAllowed(origin)).toBe(false)
  })

  it('should block everything when no origin is configured', () => {
    expect(createOriginMatcher([])('http://localhost:5173')).toBe(false)
  })

  it('should treat dots in the configured host literally', () => {
    const matcher = createOriginMatcher(['https://*.consertiva.com.br'])

    expect(matcher('https://loja.consertivaXcom.br')).toBe(false)
  })
})
