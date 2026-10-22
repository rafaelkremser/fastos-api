import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidRefreshTokenError extends Error implements UseCaseError {
  constructor() {
    super('Refresh token is not valid.')
  }
}
