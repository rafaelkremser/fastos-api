import { Injectable } from '@nestjs/common'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrderHistoryRepository } from '@/domain/service-order/application/repositories/service-order-history-repository'
import { ServiceOrderHistory } from '@/domain/service-order/enterprise/entities/service-order-history'
import { PrismaService } from '../prisma.service'
import { PrismaServiceOrderHistoryMapper } from '../mappers/prisma-service-order-history-mapper'

@Injectable()
export class PrismaServiceOrderHistoryRepository
  implements ServiceOrderHistoryRepository
{
  constructor(private prisma: PrismaService) {}

  async findManyByServiceOrderId(
    serviceOrderId: string,
    { page, perPage = 20 }: PaginationParams,
  ): Promise<ServiceOrderHistory[]> {
    const history = await this.prisma.client.serviceOrderHistory.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return history.map(PrismaServiceOrderHistoryMapper.toDomain)
  }

  async create(history: ServiceOrderHistory): Promise<void> {
    const data = PrismaServiceOrderHistoryMapper.toPrisma(history)

    await this.prisma.client.serviceOrderHistory.create({
      data,
    })
  }
}
