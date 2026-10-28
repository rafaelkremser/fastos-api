import { UseCaseError } from '@/core/errors/use-case-error'

export class CustomerHasServiceOrdersError extends Error implements UseCaseError {
  constructor() {
    super('Customer has service orders and cannot be deleted.')
  }
}
