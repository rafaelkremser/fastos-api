import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'

// A status change, with when its order came in: the first stay ("OPEN")
// starts at the entry, since opening an order writes no history
export interface StatusChange {
  serviceOrderId: string
  from: string | null
  to: string | null
  changedAt: Date
  orderEntryDate: Date
}

export abstract class ServiceOrderHistoryRepository {
  abstract findManyByServiceOrderId(
    serviceOrderId: string,
    params: PaginationParams,
  ): Promise<ServiceOrderHistory[]>
  // Every status change of the tenant's orders that changed status since
  // then, by order and oldest first: a stay that ended after that date may
  // have begun before it
  abstract findStatusChanges(
    tenantId: string,
    since: Date,
  ): Promise<StatusChange[]>
  abstract create(history: ServiceOrderHistory): Promise<void>
}
