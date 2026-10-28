import { UseCaseError } from '@/core/errors/use-case-error'

export class InactiveTenantError extends Error implements UseCaseError {
  constructor() {
    super('Tenant is not active.')
  }
}
