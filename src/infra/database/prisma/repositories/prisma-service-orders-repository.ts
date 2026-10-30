import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import {
  DailyDeliveredTotals,
  DeliveredTotals,
  ServiceOrdersRepository,
  ServiceOrderFilters,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import {
  ACTIVE_STATUSES,
  CUSTOMER_NOTICE_STATUSES,
  ServiceOrder,
} from '@/domain/service-order/enterprise/entities/service-order'
import { ServiceOrderSummary } from '@/domain/service-order/enterprise/entities/value-objects/service-order-summary'
import { PrismaService } from '../prisma.service'
import { PrismaServiceOrderMapper } from '../mappers/prisma-service-order-mapper'
import {
  PrismaServiceOrderSummaryMapper,
  serviceOrderSummaryInclude,
} from '../mappers/prisma-service-order-summary-mapper'
import { DomainEvents } from '@/core/events/domain-events'

const withItems = {
  items: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ServiceOrderInclude

// The columns are timestamps without time zone, holding UTC. The instants go
// as ISO text and are turned into UTC there, whatever the session time zone
function utc(date: Date) {
  return Prisma.sql`(${date.toISOString()}::timestamptz AT TIME ZONE 'UTC')`
}

// Orders delivered in the period, with the order total of
// ServiceOrder.totalWithDiscount: the final cost, or else the quote, or else
// the items, minus the discount
function deliveredOrders(tenantId: string, start: Date, end: Date) {
  return Prisma.sql`
    FROM (
      SELECT
        so.delivered_date,
        COALESCE(
          so.final_cost,
          so.estimated_cost,
          (
            SELECT SUM(item.total_price)
            FROM service_order_items item
            WHERE item.service_order_id = so.id
          ),
          0
        ) - COALESCE(so.discount, 0) AS total
      FROM service_orders so
      WHERE so.tenant_id = ${tenantId}
        AND so.status = 'DELIVERED'
        AND so.delivered_date >= ${utc(start)}
        AND so.delivered_date < ${utc(end)}
    ) delivered
  `
}

function whereFilters(
  tenantId: string,
  filters: ServiceOrderFilters,
): Prisma.ServiceOrderWhereInput {
  return {
    tenantId,
    ...(filters.number && { number: filters.number }),
    ...(filters.status && { status: filters.status as any }),
    ...(filters.technicianId && { technicianId: filters.technicianId }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.deviceId && { deviceId: filters.deviceId }),
    // Inside AND, so it does not replace a status filter given with it
    ...(filters.needsCustomerNotice && {
      AND: [
        { status: { in: CUSTOMER_NOTICE_STATUSES } },
        { customerNotifiedAt: null },
      ],
    }),
    ...(filters.startDate &&
      filters.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
  }
}

@Injectable()
export class PrismaServiceOrdersRepository implements ServiceOrdersRepository {
  constructor(
    private prisma: PrismaService,
    private serviceOrderItemsRepository: ServiceOrderItemsRepository,
  ) {}

  async findById(id: string): Promise<ServiceOrder | null> {
    const serviceOrder = await this.prisma.client.serviceOrder.findUnique({
      where: { id },
      include: withItems,
    })

    if (!serviceOrder) {
      return null
    }

    return PrismaServiceOrderMapper.toDomain(serviceOrder)
  }

  async findByNumber(
    tenantId: string,
    number: number,
  ): Promise<ServiceOrder | null> {
    const serviceOrder = await this.prisma.client.serviceOrder.findFirst({
      where: {
        tenantId,
        number,
      },
      include: withItems,
    })

    if (!serviceOrder) {
      return null
    }

    return PrismaServiceOrderMapper.toDomain(serviceOrder)
  }

  async findManySummaries(
    tenantId: string,
    filters: ServiceOrderFilters,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ): Promise<ServiceOrderSummary[]> {
    const serviceOrders = await this.prisma.client.serviceOrder.findMany({
      where: whereFilters(tenantId, filters),
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
      include: serviceOrderSummaryInclude,
    })

    return serviceOrders.map(PrismaServiceOrderSummaryMapper.toDomain)
  }

  async count(tenantId: string, filters: ServiceOrderFilters): Promise<number> {
    return this.prisma.client.serviceOrder.count({
      where: whereFilters(tenantId, filters),
    })
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const counts = await this.prisma.client.serviceOrder.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    })

    return counts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>,
    )
  }

  async countLate(tenantId: string, today: Date): Promise<number> {
    return this.prisma.client.serviceOrder.count({
      where: {
        tenantId,
        status: { in: ACTIVE_STATUSES },
        estimatedDate: { lt: today },
      },
    })
  }

  async sumDelivered(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<DeliveredTotals> {
    const [totals] = await this.prisma.client.$queryRaw<DeliveredTotals[]>`
      SELECT
        COUNT(*)::int AS delivered,
        COALESCE(SUM(total), 0)::float8 AS revenue
      ${deliveredOrders(tenantId, start, end)}
    `

    return totals
  }

  async sumDeliveredByDay(
    tenantId: string,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<DailyDeliveredTotals[]> {
    return this.prisma.client.$queryRaw<DailyDeliveredTotals[]>`
      SELECT
        to_char(
          (delivered_date AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone},
          'YYYY-MM-DD'
        ) AS day,
        COUNT(*)::int AS delivered,
        SUM(total)::float8 AS revenue
      ${deliveredOrders(tenantId, start, end)}
      GROUP BY 1
      ORDER BY 1
    `
  }

  async reserveNextNumber(tenantId: string): Promise<number> {
    // Prisma runs this as a single INSERT ... ON CONFLICT DO UPDATE, which
    // locks the counter until the transaction ends: concurrent orders wait
    // instead of reading the same number. Keep it a plain upsert (no nested
    // writes or relation reads), or Prisma splits it into separate queries
    const counter = await this.prisma.client.serviceOrderCounter.upsert({
      where: { tenantId },
      create: { tenantId, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    })

    return counter.lastNumber
  }

  async create(serviceOrder: ServiceOrder): Promise<void> {
    const data = PrismaServiceOrderMapper.toPrisma(serviceOrder)

    // The order and its items are one unit: saved together or not at all
    await this.prisma.runInTransaction(async () => {
      await this.prisma.client.serviceOrder.create({
        data,
      })
      await this.serviceOrderItemsRepository.createMany(
        serviceOrder.items.getItems(),
      )
    })

    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async save(serviceOrder: ServiceOrder): Promise<void> {
    const data = PrismaServiceOrderMapper.toPrisma(serviceOrder)

    await this.prisma.runInTransaction(async () => {
      await this.prisma.client.serviceOrder.update({
        where: { id: data.id },
        data,
      })
      await this.serviceOrderItemsRepository.createMany(
        serviceOrder.items.getNewItems(),
      )
      await this.serviceOrderItemsRepository.deleteMany(
        serviceOrder.items.getRemovedItems(),
      )
    })

    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async delete(serviceOrder: ServiceOrder): Promise<void> {
    await this.prisma.client.serviceOrder.delete({
      where: { id: serviceOrder.id.toString() },
    })
  }
}
