import { ValueObject } from '@/core/entities/value-object'

interface SlugProps {
  value: string
}

export class Slug extends ValueObject<SlugProps> {
  static readonly MIN_LENGTH = 3
  static readonly MAX_LENGTH = 63

  // Subdomains the platform keeps for itself
  private static readonly RESERVED = new Set([
    'www',
    'api',
    'app',
    'admin',
    'auth',
    'login',
    'mail',
    'smtp',
    'static',
    'assets',
    'cdn',
    'docs',
    'status',
    'help',
    'support',
    'billing',
    'dashboard',
    'dev',
    'staging',
  ])

  get value() {
    return this.props.value
  }

  isValid() {
    return (
      this.value.length >= Slug.MIN_LENGTH &&
      this.value.length <= Slug.MAX_LENGTH &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.value) &&
      !Slug.RESERVED.has(this.value)
    )
  }

  static create(value: string) {
    return new Slug({ value })
  }

  /**
   * "Assistência Técnica São João" -> "assistencia-tecnica-sao-joao"
   */
  static createFromText(text: string) {
    const value = text
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, Slug.MAX_LENGTH)
      .replace(/-+$/g, '')

    return new Slug({ value })
  }
}
