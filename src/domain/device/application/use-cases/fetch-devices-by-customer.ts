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
    // Across all pages, so the client can show how many pages there are
    totalCount: number
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
    const [devices, totalCount] = await Promise.all([
      this.devicesRepository.findManyByCustomerId(tenantId, customerId, {
        page,
        perPage,
      }),
      this.devicesRepository.countByCustomerId(tenantId, customerId),
    ])

    return right({
      devices,
      totalCount,
    })
  }
}
