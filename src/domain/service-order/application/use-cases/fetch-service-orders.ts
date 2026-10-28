import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { ServiceOrderSummary } from '../../enterprise/entities/value-objects/service-order-summary'
import {
  ServiceOrdersRepository,
  ServiceOrderFilters,
} from '../repositories/service-orders-repository'

interface FetchServiceOrdersUseCaseRequest {
  tenantId: string
  page: number
  perPage?: number
  number?: number
  status?: string
  technicianId?: string
  customerId?: string
  needsCustomerNotice?: boolean
  startDate?: Date
  endDate?: Date
}

type FetchServiceOrdersUseCaseResponse = Either<
  null,
  {
    serviceOrders: ServiceOrderSummary[]
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
    number,
    status,
    technicianId,
    customerId,
    needsCustomerNotice,
    startDate,
    endDate,
  }: FetchServiceOrdersUseCaseRequest): Promise<FetchServiceOrdersUseCaseResponse> {
    const filters: ServiceOrderFilters = {
      number,
      status,
      technicianId,
      customerId,
      needsCustomerNotice,
      startDate,
      endDate,
    }

    const [serviceOrders, totalCount] = await Promise.all([
      this.serviceOrdersRepository.findManySummaries(tenantId, filters, {
        page,
        perPage,
      }),
      this.serviceOrdersRepository.count(tenantId, filters),
    ])

    return right({ serviceOrders, totalCount })
  }
}
