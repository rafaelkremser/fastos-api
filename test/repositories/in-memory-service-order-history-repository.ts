import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import { ServiceOrderHistoryRepository } from '@/domain/service-order/application/repositories/service-order-history-repository'
import { ServiceOrderHistory } from '@/domain/service-order/enterprise/entities/service-order-history'

export class InMemoryServiceOrderHistoryRepository implements ServiceOrderHistoryRepository {
  public items: ServiceOrderHistory[] = []

  async findManyByServiceOrderId(
    serviceOrderId: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.items
      .filter((item) => item.serviceOrderId.toString() === serviceOrderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async create(history: ServiceOrderHistory) {
    this.items.push(history)
  }
}
