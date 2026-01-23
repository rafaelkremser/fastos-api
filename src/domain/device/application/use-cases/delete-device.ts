import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { DevicesRepository } from '../repositories/devices-repository'

interface DeleteDeviceUseCaseRequest {
  tenantId: string
  deviceId: string
}

type DeleteDeviceUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteDeviceUseCase {
  constructor(private devicesRepository: DevicesRepository) {}

  async execute({
    tenantId,
    deviceId,
  }: DeleteDeviceUseCaseRequest): Promise<DeleteDeviceUseCaseResponse> {
    const device = await this.devicesRepository.findById(deviceId)

    if (!device) {
      return left(new ResourceNotFoundError())
    }

    if (device.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    await this.devicesRepository.delete(device)

    return right(null)
  }
}
