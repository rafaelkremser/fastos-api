import { Prisma, ServiceOrderItem as PrismaServiceOrderItem } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ServiceOrderItem,
  ItemType,
} from '@/domain/service-order/enterprise/entities/service-order-item'

export class PrismaServiceOrderItemMapper {
  static toDomain(raw: PrismaServiceOrderItem): ServiceOrderItem {
    return ServiceOrderItem.create(
      {
        serviceOrderId: new UniqueEntityID(raw.serviceOrderId),
        type: raw.type as ItemType,
        description: raw.description,
        quantity: raw.quantity,
        unitPrice: raw.unitPrice.toNumber(),
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    item: ServiceOrderItem,
  ): Prisma.ServiceOrderItemUncheckedCreateInput {
    return {
      id: item.id.toString(),
      serviceOrderId: item.serviceOrderId.toString(),
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt,
    }
  }
}
