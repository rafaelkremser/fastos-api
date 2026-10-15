import { Slug } from './slug'

describe('Slug', () => {
  it('should create a slug from text, removing accents and punctuation', () => {
    expect(Slug.createFromText('Assistência Técnica São João').value).toBe(
      'assistencia-tecnica-sao-joao',
    )
    expect(Slug.createFromText('  Tech & Cia. Ltda!! ').value).toBe(
      'tech-cia-ltda',
    )
    expect(Slug.createFromText('Conserto_Rápido 24h').value).toBe(
      'conserto-rapido-24h',
    )
  })

  it('should cut long text to 63 characters without a trailing hyphen', () => {
    const slug = Slug.createFromText(`${'a'.repeat(62)} b`)

    expect(slug.value).toBe('a'.repeat(62))
    expect(slug.isValid()).toBe(true)
  })

  it.each(['minha-loja', 'loja24', 'abc'])('should accept "%s"', (value) => {
    expect(Slug.create(value).isValid()).toBe(true)
  })

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(64)],
    ['uppercase', 'Minha-Loja'],
    ['leading hyphen', '-loja'],
    ['trailing hyphen', 'loja-'],
    ['double hyphen', 'minha--loja'],
    ['underscore', 'minha_loja'],
    ['reserved word', 'api'],
    ['reserved word', 'admin'],
  ])('should reject %s ("%s")', (_, value) => {
    expect(Slug.create(value).isValid()).toBe(false)
  })
})
