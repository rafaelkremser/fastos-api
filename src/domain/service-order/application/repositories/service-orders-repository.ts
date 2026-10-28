import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrder } from '../../enterprise/entities/service-order'
import { ServiceOrderSummary } from '../../enterprise/entities/value-objects/service-order-summary'

export interface ServiceOrderFilters {
  number?: number
  status?: string
  technicianId?: string
  customerId?: string
  deviceId?: string
  startDate?: Date
  endDate?: Date
}

export abstract class ServiceOrdersRepository {
  abstract findById(id: string): Promise<ServiceOrder | null>
  abstract findByNumber(
    tenantId: string,
    number: number,
  ): Promise<ServiceOrder | null>
  abstract findManySummaries(
    tenantId: string,
    filters: ServiceOrderFilters,
    params: PaginationParams,
  ): Promise<ServiceOrderSummary[]>
  // Counts what findManySummaries finds with the same filters, across all pages
  abstract count(
    tenantId: string,
    filters: ServiceOrderFilters,
  ): Promise<number>
  abstract countByStatus(tenantId: string): Promise<Record<string, number>>
  abstract reserveNextNumber(tenantId: string): Promise<number>
  abstract create(serviceOrder: ServiceOrder): Promise<void>
  abstract save(serviceOrder: ServiceOrder): Promise<void>
  abstract delete(serviceOrder: ServiceOrder): Promise<void>
}
