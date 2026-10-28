import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrdersRepository } from '@/domain/service-order/application/repositories/service-orders-repository'
import { DevicesRepository } from '../repositories/devices-repository'
import { DeviceHasServiceOrdersError } from './errors/device-has-service-orders-error'

interface DeleteDeviceUseCaseRequest {
  tenantId: string
  deviceId: string
}

type DeleteDeviceUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | DeviceHasServiceOrdersError,
  null
>

@Injectable()
export class DeleteDeviceUseCase {
  constructor(
    private devicesRepository: DevicesRepository,
    private serviceOrdersRepository: ServiceOrdersRepository,
  ) {}

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

    // Service orders are the store's history, so they keep their device
    const serviceOrders = await this.serviceOrdersRepository.count(tenantId, {
      deviceId,
    })

    if (serviceOrders > 0) {
      return left(new DeviceHasServiceOrdersError())
    }

    await this.devicesRepository.delete(device)

    return right(null)
  }
}
