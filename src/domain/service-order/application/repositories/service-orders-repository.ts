import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrder } from '../../enterprise/entities/service-order'
import { ServiceOrderSummary } from '../../enterprise/entities/value-objects/service-order-summary'

export interface ServiceOrderFilters {
  number?: number
  status?: string
  technicianId?: string
  customerId?: string
  deviceId?: string
  // Waiting for the store to tell the customer about the current status
  needsCustomerNotice?: boolean
  startDate?: Date
  endDate?: Date
}

// Delivered orders and what they add up to, by the order total rule
export interface DeliveredTotals {
  delivered: number
  revenue: number
}

export interface DailyDeliveredTotals extends DeliveredTotals {
  // YYYY-MM-DD, in the time zone asked for
  day: string
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
  // Active orders whose due day is before this one (a midnight UTC, the way
  // due days are kept)
  abstract countLate(tenantId: string, today: Date): Promise<number>
  // Orders delivered from start (included) to end (excluded)
  abstract sumDelivered(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<DeliveredTotals>
  // The same, per calendar day in the time zone; days without deliveries
  // are left out
  abstract sumDeliveredByDay(
    tenantId: string,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<DailyDeliveredTotals[]>
  abstract reserveNextNumber(tenantId: string): Promise<number>
  abstract create(serviceOrder: ServiceOrder): Promise<void>
  abstract save(serviceOrder: ServiceOrder): Promise<void>
  abstract delete(serviceOrder: ServiceOrder): Promise<void>
}
