import { DomainEvents } from '@/core/events/domain-events'
import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import { getDayInTimeZone } from '@/core/time/time-zone'
import {
  DailyDeliveredTotals,
  ServiceOrderFilters,
  ServiceOrdersRepository,
  TechnicianTotals,
  TechnicianTotalsPeriod,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import {
  ACTIVE_STATUSES,
  ServiceOrder,
} from '@/domain/service-order/enterprise/entities/service-order'
import { ServiceOrderSummary } from '@/domain/service-order/enterprise/entities/value-objects/service-order-summary'
import { InMemoryCustomersRepository } from './in-memory-customers-repository'
import { InMemoryDevicesRepository } from './in-memory-devices-repository'
import { InMemoryUsersRepository } from './in-memory-users-repository'

export class InMemoryServiceOrdersRepository implements ServiceOrdersRepository {
  public items: ServiceOrder[] = []
  public lastNumbers = new Map<string, number>()

  // The summaries read customers, devices and technicians from these, so a
  // test that lists orders registers them there too
  constructor(
    private serviceOrderItemsRepository: ServiceOrderItemsRepository,
    private customersRepository = new InMemoryCustomersRepository(),
    private devicesRepository = new InMemoryDevicesRepository(),
    private usersRepository = new InMemoryUsersRepository(),
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

  async findManySummaries(
    tenantId: string,
    filters: ServiceOrderFilters,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.matching(tenantId, filters)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
      .map((order) => this.summarize(order))
  }

  private summarize(order: ServiceOrder) {
    const customer = this.customersRepository.items.find((item) =>
      item.id.equals(order.customerId),
    )
    const device = this.devicesRepository.items.find((item) =>
      item.id.equals(order.deviceId),
    )
    const technician = order.technicianId
      ? this.usersRepository.items.find((item) =>
          item.id.equals(order.technicianId!),
        )
      : null

    if (!customer || !device) {
      throw new Error(
        `Service order ${order.number} has no customer or device registered.`,
      )
    }

    return ServiceOrderSummary.create({
      serviceOrderId: order.id,
      number: order.number,
      status: order.status,
      priority: order.priority,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deviceId: device.id,
      deviceType: device.type,
      deviceBrand: device.brand,
      deviceModel: device.model,
      technicianId: order.technicianId,
      technicianName: technician?.name ?? null,
      entryDate: order.entryDate,
      estimatedDate: order.estimatedDate,
      customerNotifiedAt: order.customerNotifiedAt,
      createdAt: order.createdAt,
    })
  }

  async count(tenantId: string, filters: ServiceOrderFilters) {
    return this.matching(tenantId, filters).length
  }

  private matching(tenantId: string, filters: ServiceOrderFilters) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .filter((item) => !filters.number || item.number === filters.number)
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
      .filter(
        (item) => !filters.needsCustomerNotice || item.needsCustomerNotice,
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

  async countLate(tenantId: string, today: Date) {
    return this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        ACTIVE_STATUSES.includes(item.status) &&
        item.estimatedDate !== null &&
        item.estimatedDate < today,
    ).length
  }

  private delivered(tenantId: string, start: Date, end: Date) {
    return this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        item.status === 'DELIVERED' &&
        item.deliveredDate !== null &&
        item.deliveredDate >= start &&
        item.deliveredDate < end,
    )
  }

  async sumDelivered(tenantId: string, start: Date, end: Date) {
    const orders = this.delivered(tenantId, start, end)

    return {
      delivered: orders.length,
      revenue: orders.reduce((sum, item) => sum + item.totalWithDiscount, 0),
    }
  }

  async sumDeliveredByDay(
    tenantId: string,
    start: Date,
    end: Date,
    timeZone: string,
  ) {
    const days = new Map<string, DailyDeliveredTotals>()

    for (const order of this.delivered(tenantId, start, end)) {
      const day = getDayInTimeZone(order.deliveredDate!, timeZone)
      const totals = days.get(day) ?? { day, delivered: 0, revenue: 0 }

      totals.delivered += 1
      totals.revenue += order.totalWithDiscount
      days.set(day, totals)
    }

    return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
  }

  async sumByTechnician(
    tenantId: string,
    { today, start, end }: TechnicianTotalsPeriod,
  ) {
    const rows = new Map<string | null, TechnicianTotals>()
    const within = (date: Date | null) =>
      date !== null && date >= start && date < end

    for (const order of this.items) {
      if (order.tenantId.toString() !== tenantId) continue

      const technicianId = order.technicianId?.toString() ?? null
      const row = rows.get(technicianId) ?? {
        technicianId,
        active: 0,
        late: 0,
        completed: 0,
        delivered: 0,
        revenue: 0,
      }
      const isActive = ACTIVE_STATUSES.includes(order.status)

      if (isActive) row.active += 1
      if (isActive && order.estimatedDate && order.estimatedDate < today) {
        row.late += 1
      }
      if (
        (order.status === 'COMPLETED' || order.status === 'DELIVERED') &&
        within(order.completedDate)
      ) {
        row.completed += 1
      }
      if (order.status === 'DELIVERED' && within(order.deliveredDate)) {
        row.delivered += 1
        row.revenue += order.totalWithDiscount
      }

      rows.set(technicianId, row)
    }

    return [...rows.values()]
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
