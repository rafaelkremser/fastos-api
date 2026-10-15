import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidTenantSlugError extends Error implements UseCaseError {
  constructor(slug: string) {
    super(
      `Tenant address "${slug}" is not valid. Use 3 to 63 lowercase letters, numbers and single hyphens, and avoid reserved words.`,
    )
  }
}
