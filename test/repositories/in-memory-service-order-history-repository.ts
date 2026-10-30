import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import {
  ServiceOrderHistoryRepository,
  StatusChange,
} from '@/domain/service-order/application/repositories/service-order-history-repository'
import { ServiceOrderHistory } from '@/domain/service-order/enterprise/entities/service-order-history'
import { InMemoryServiceOrderItemsRepository } from './in-memory-service-order-items-repository'
import { InMemoryServiceOrdersRepository } from './in-memory-service-orders-repository'

export class InMemoryServiceOrderHistoryRepository implements ServiceOrderHistoryRepository {
  public items: ServiceOrderHistory[] = []

  // The status changes read the orders' tenant and entry date from here, so a
  // test that measures stays registers the orders there too
  constructor(
    private serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    ),
  ) {}

  async findManyByServiceOrderId(
    serviceOrderId: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.items
      .filter((item) => item.serviceOrderId.toString() === serviceOrderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async findStatusChanges(tenantId: string, since: Date) {
    const changes: StatusChange[] = []

    for (const order of this.serviceOrdersRepository.items) {
      if (order.tenantId.toString() !== tenantId) continue

      const orderChanges = this.items
        .filter(
          (item) =>
            item.serviceOrderId.equals(order.id) &&
            item.action === 'STATUS_CHANGED',
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      if (!orderChanges.some((item) => item.createdAt >= since)) continue

      changes.push(
        ...orderChanges.map((item) => ({
          serviceOrderId: order.id.toString(),
          from: item.oldValue,
          to: item.newValue,
          changedAt: item.createdAt,
          orderEntryDate: order.entryDate,
        })),
      )
    }

    return changes
  }

  async create(history: ServiceOrderHistory) {
    this.items.push(history)
  }
}
