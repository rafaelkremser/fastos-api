import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'

export abstract class ServiceOrderHistoryRepository {
  abstract findManyByServiceOrderId(
    serviceOrderId: string,
    params: PaginationParams,
  ): Promise<ServiceOrderHistory[]>
  abstract create(history: ServiceOrderHistory): Promise<void>
}
