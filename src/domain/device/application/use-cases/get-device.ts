import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Device } from '../../enterprise/entities/device'
import { DevicesRepository } from '../repositories/devices-repository'

interface GetDeviceUseCaseRequest {
  tenantId: string
  deviceId: string
}

type GetDeviceUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    device: Device
  }
>

@Injectable()
export class GetDeviceUseCase {
  constructor(private devicesRepository: DevicesRepository) {}

  async execute({
    tenantId,
    deviceId,
  }: GetDeviceUseCaseRequest): Promise<GetDeviceUseCaseResponse> {
    const device = await this.devicesRepository.findById(deviceId)

    if (!device) {
      return left(new ResourceNotFoundError())
    }

    if (device.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    return right({
      device,
    })
  }
}
