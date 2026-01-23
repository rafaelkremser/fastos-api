import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { Device } from '../../enterprise/entities/device'
import { DevicesRepository } from '../repositories/devices-repository'

interface FetchDevicesByCustomerUseCaseRequest {
  tenantId: string
  customerId: string
  page: number
  perPage?: number
}

type FetchDevicesByCustomerUseCaseResponse = Either<
  null,
  {
    devices: Device[]
  }
>

@Injectable()
export class FetchDevicesByCustomerUseCase {
  constructor(private devicesRepository: DevicesRepository) {}

  async execute({
    tenantId,
    customerId,
    page,
    perPage,
  }: FetchDevicesByCustomerUseCaseRequest): Promise<FetchDevicesByCustomerUseCaseResponse> {
    const devices = await this.devicesRepository.findManyByCustomerId(
      tenantId,
      customerId,
      { page, perPage },
    )

    return right({
      devices,
    })
  }
}
