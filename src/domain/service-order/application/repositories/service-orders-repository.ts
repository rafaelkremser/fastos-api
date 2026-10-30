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

// One technician's orders, or the unassigned ones (technicianId null)
export interface TechnicianTotals extends DeliveredTotals {
  technicianId: string | null
  // Right now: active, and active past the due day
  active: number
  late: number
  // In the period: orders that became ready (and stayed ready or were
  // delivered since); delivered and revenue as in DeliveredTotals
  completed: number
}

export interface TechnicianTotalsPeriod {
  // Midnight UTC of today, the way due days are kept
  today: Date
  start: Date
  end: Date
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
  // A row per technician with orders, and one for the unassigned ones if any;
  // technicians without orders are left out
  abstract sumByTechnician(
    tenantId: string,
    period: TechnicianTotalsPeriod,
  ): Promise<TechnicianTotals[]>
  abstract reserveNextNumber(tenantId: string): Promise<number>
  abstract create(serviceOrder: ServiceOrder): Promise<void>
  abstract save(serviceOrder: ServiceOrder): Promise<void>
  abstract delete(serviceOrder: ServiceOrder): Promise<void>
}
