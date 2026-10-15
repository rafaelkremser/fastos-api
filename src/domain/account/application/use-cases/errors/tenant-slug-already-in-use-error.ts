import { UseCaseError } from '@/core/errors/use-case-error'

export class TenantSlugAlreadyInUseError extends Error implements UseCaseError {
  constructor(slug: string) {
    super(`Tenant address "${slug}" is already in use.`)
  }
}
