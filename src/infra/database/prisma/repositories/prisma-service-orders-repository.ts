import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginationParams } from '@/core/repositories/pagination-params'
import {
  ServiceOrdersRepository,
  ServiceOrderFilters,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'
import { PrismaService } from '../prisma.service'
import { PrismaServiceOrderMapper } from '../mappers/prisma-service-order-mapper'
import { DomainEvents } from '@/core/events/domain-events'

const withItems = {
  items: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ServiceOrderInclude

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

  async findMany(
    tenantId: string,
    filters: ServiceOrderFilters,
    { page, perPage = 20 }: PaginationParams,
  ): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.client.serviceOrder.findMany({
      where: {
        tenantId,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.technicianId && { technicianId: filters.technicianId }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.startDate &&
          filters.endDate && {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
      include: withItems,
    })

    return serviceOrders.map(PrismaServiceOrderMapper.toDomain)
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
