import { Injectable } from '@nestjs/common'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { ServiceOrderItem } from '@/domain/service-order/enterprise/entities/service-order-item'
import { PrismaService } from '../prisma.service'
import { PrismaServiceOrderItemMapper } from '../mappers/prisma-service-order-item-mapper'

@Injectable()
export class PrismaServiceOrderItemsRepository
  implements ServiceOrderItemsRepository
{
  constructor(private prisma: PrismaService) {}

  async createMany(items: ServiceOrderItem[]): Promise<void> {
    if (items.length === 0) {
      return
    }

    const data = items.map(PrismaServiceOrderItemMapper.toPrisma)

    await this.prisma.client.serviceOrderItem.createMany({
      data,
    })
  }

  async deleteMany(items: ServiceOrderItem[]): Promise<void> {
    if (items.length === 0) {
      return
    }

    const ids = items.map((item) => item.id.toString())

    await this.prisma.client.serviceOrderItem.deleteMany({
      where: { id: { in: ids } },
    })
  }
}
