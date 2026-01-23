import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { ServiceOrder } from '../../enterprise/entities/service-order'
import {
  ServiceOrdersRepository,
  ServiceOrderFilters,
} from '../repositories/service-orders-repository'

interface FetchServiceOrdersUseCaseRequest {
  tenantId: string
  page: number
  perPage?: number
  status?: string
  technicianId?: string
  customerId?: string
  startDate?: Date
  endDate?: Date
}

type FetchServiceOrdersUseCaseResponse = Either<
  null,
  { serviceOrders: ServiceOrder[] }
>

@Injectable()
export class FetchServiceOrdersUseCase {
  constructor(private serviceOrdersRepository: ServiceOrdersRepository) {}

  async execute({
    tenantId,
    page,
    perPage,
    status,
    technicianId,
    customerId,
    startDate,
    endDate,
  }: FetchServiceOrdersUseCaseRequest): Promise<FetchServiceOrdersUseCaseResponse> {
    const filters: ServiceOrderFilters = {
      status,
      technicianId,
      customerId,
      startDate,
      endDate,
    }

    const serviceOrders = await this.serviceOrdersRepository.findMany(
      tenantId,
      filters,
      { page, perPage },
    )

    return right({ serviceOrders })
  }
}
