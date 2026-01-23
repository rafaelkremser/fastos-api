import { UseCaseError } from '@/core/errors/use-case-error'

export class TenantAlreadyExistsError extends Error implements UseCaseError {
  constructor(identifier: string) {
    super(`Tenant "${identifier}" already exists.`)
  }
}
