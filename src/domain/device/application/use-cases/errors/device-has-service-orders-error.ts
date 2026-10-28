import { UseCaseError } from '@/core/errors/use-case-error'

export class DeviceHasServiceOrdersError extends Error implements UseCaseError {
  constructor() {
    super('Device has service orders and cannot be deleted.')
  }
}
