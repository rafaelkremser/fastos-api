import { Injectable } from '@nestjs/common'
import { PaginationParams } from '@/core/repositories/pagination-params'
import {
  ServiceOrdersRepository,
  ServiceOrderFilters,
} from '@/domain/service-order/application/repositories/service-orders-repository'
import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'
import { PrismaService } from '../prisma.service'
import { PrismaServiceOrderMapper } from '../mappers/prisma-service-order-mapper'
import { DomainEvents } from '@/core/events/domain-events'

@Injectable()
export class PrismaServiceOrdersRepository implements ServiceOrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<ServiceOrder | null> {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id },
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
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        tenantId,
        number,
      },
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
    const serviceOrders = await this.prisma.serviceOrder.findMany({
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
    })

    return serviceOrders.map(PrismaServiceOrderMapper.toDomain)
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const counts = await this.prisma.serviceOrder.groupBy({
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

  async getNextNumber(tenantId: string): Promise<number> {
    const lastOrder = await this.prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
      select: { number: true },
    })

    return (lastOrder?.number ?? 0) + 1
  }

  async create(serviceOrder: ServiceOrder): Promise<void> {
    const data = PrismaServiceOrderMapper.toPrisma(serviceOrder)

    await this.prisma.serviceOrder.create({
      data,
    })

    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async save(serviceOrder: ServiceOrder): Promise<void> {
    const data = PrismaServiceOrderMapper.toPrisma(serviceOrder)

    await this.prisma.serviceOrder.update({
      where: { id: data.id },
      data,
    })

    DomainEvents.dispatchEventsForAggregate(serviceOrder.id)
  }

  async delete(serviceOrder: ServiceOrder): Promise<void> {
    await this.prisma.serviceOrder.delete({
      where: { id: serviceOrder.id.toString() },
    })
  }
}
