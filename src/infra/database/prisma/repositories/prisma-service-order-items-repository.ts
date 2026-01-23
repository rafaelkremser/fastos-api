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

  async findById(id: string): Promise<ServiceOrderItem | null> {
    const item = await this.prisma.serviceOrderItem.findUnique({
      where: { id },
    })

    if (!item) {
      return null
    }

    return PrismaServiceOrderItemMapper.toDomain(item)
  }

  async findManyByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderItem[]> {
    const items = await this.prisma.serviceOrderItem.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'asc' },
    })

    return items.map(PrismaServiceOrderItemMapper.toDomain)
  }

  async create(item: ServiceOrderItem): Promise<void> {
    const data = PrismaServiceOrderItemMapper.toPrisma(item)

    await this.prisma.serviceOrderItem.create({
      data,
    })
  }

  async createMany(items: ServiceOrderItem[]): Promise<void> {
    const data = items.map(PrismaServiceOrderItemMapper.toPrisma)

    await this.prisma.serviceOrderItem.createMany({
      data,
    })
  }

  async save(item: ServiceOrderItem): Promise<void> {
    const data = PrismaServiceOrderItemMapper.toPrisma(item)

    await this.prisma.serviceOrderItem.update({
      where: { id: data.id },
      data,
    })
  }

  async delete(item: ServiceOrderItem): Promise<void> {
    await this.prisma.serviceOrderItem.delete({
      where: { id: item.id.toString() },
    })
  }

  async deleteMany(items: ServiceOrderItem[]): Promise<void> {
    const ids = items.map((item) => item.id.toString())

    await this.prisma.serviceOrderItem.deleteMany({
      where: { id: { in: ids } },
    })
  }

  async deleteManyByServiceOrderId(serviceOrderId: string): Promise<void> {
    await this.prisma.serviceOrderItem.deleteMany({
      where: { serviceOrderId },
    })
  }
}
