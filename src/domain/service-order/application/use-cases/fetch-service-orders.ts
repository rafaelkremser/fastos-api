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
  {
    serviceOrders: ServiceOrder[]
    // Across all pages, so the client can show how many pages there are
    totalCount: number
  }
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

    const [serviceOrders, totalCount] = await Promise.all([
      this.serviceOrdersRepository.findMany(tenantId, filters, {
        page,
        perPage,
      }),
      this.serviceOrdersRepository.count(tenantId, filters),
    ])

    return right({ serviceOrders, totalCount })
  }
}
