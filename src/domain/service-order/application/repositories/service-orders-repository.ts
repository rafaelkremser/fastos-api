import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrder } from '../../enterprise/entities/service-order'

export interface ServiceOrderFilters {
  status?: string
  technicianId?: string
  customerId?: string
  startDate?: Date
  endDate?: Date
}

export abstract class ServiceOrdersRepository {
  abstract findById(id: string): Promise<ServiceOrder | null>
  abstract findByNumber(
    tenantId: string,
    number: number,
  ): Promise<ServiceOrder | null>
  abstract findMany(
    tenantId: string,
    filters: ServiceOrderFilters,
    params: PaginationParams,
  ): Promise<ServiceOrder[]>
  // Counts what findMany finds with the same filters, across all pages
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
