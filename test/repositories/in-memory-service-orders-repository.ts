import { DomainEvents } from '@/core/events/domain-events'
import { PaginationParams } from '@/core/repositories/pagination-params'
import {
  ServiceOrderFilters,
  ServiceOrdersRepository,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'

export class InMemoryServiceOrdersRepository implements ServiceOrdersRepository {
  public items: ServiceOrder[] = []

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
    { page, perPage = 20 }: PaginationParams,
  ) {
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async countByStatus(tenantId: string) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .reduce<Record<string, number>>((counts, item) => {
        counts[item.status] = (counts[item.status] ?? 0) + 1
        return counts
      }, {})
  }

  async getNextNumber(tenantId: string) {
    const numbers = this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .map((item) => item.number)

    return Math.max(0, ...numbers) + 1
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
