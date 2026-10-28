import { DomainEvents } from '@/core/events/domain-events'
import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import {
  ServiceOrderFilters,
  ServiceOrdersRepository,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'

export class InMemoryServiceOrdersRepository implements ServiceOrdersRepository {
  public items: ServiceOrder[] = []
  public lastNumbers = new Map<string, number>()

  constructor(
    private serviceOrderItemsRepository: ServiceOrderItemsRepository,
  ) {}

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByNumber(tenantId: string, number: number) {
    return (
      this.items.find(
        (item) =>
          item.tenantId.toString() === tenantId && item.number === number,
      ) ?? null
    )
  }

  async findMany(
    tenantId: string,
    filters: ServiceOrderFilters,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.matching(tenantId, filters)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async count(tenantId: string, filters: ServiceOrderFilters) {
    return this.matching(tenantId, filters).length
  }

  private matching(tenantId: string, filters: ServiceOrderFilters) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter(
        (item) =>
          !filters.technicianId ||
          item.technicianId?.toString() === filters.technicianId,
      )
      .filter(
        (item) =>
          !filters.customerId ||
          item.customerId.toString() === filters.customerId,
      )
      .filter(
        (item) =>
          !filters.deviceId || item.deviceId.toString() === filters.deviceId,
      )
  }

  async countByStatus(tenantId: string) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .reduce<Record<string, number>>((counts, item) => {
        counts[item.status] = (counts[item.status] ?? 0) + 1
        return counts
      }, {})
  }

  async reserveNextNumber(tenantId: string) {
    const number = (this.lastNumbers.get(tenantId) ?? 0) + 1
    this.lastNumbers.set(tenantId, number)
    return number
  }

  async create(serviceOrder: ServiceOrder) {
    this.items.push(serviceOrder)
    await this.serviceOrderItemsRepository.createMany(
      serviceOrder.items.getItems(),
    )
    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async save(serviceOrder: ServiceOrder) {
    const index = this.items.findIndex((item) =>
      item.id.equals(serviceOrder.id),
    )
    this.items[index] = serviceOrder
    await this.serviceOrderItemsRepository.createMany(
      serviceOrder.items.getNewItems(),
    )
    await this.serviceOrderItemsRepository.deleteMany(
      serviceOrder.items.getRemovedItems(),
    )
    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async delete(serviceOrder: ServiceOrder) {
    this.items = this.items.filter((item) => !item.id.equals(serviceOrder.id))
  }
}
