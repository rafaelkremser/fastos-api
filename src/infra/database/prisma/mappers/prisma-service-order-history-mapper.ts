import {
  Prisma,
  ServiceOrderHistory as PrismaServiceOrderHistory,
} from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderHistory } from '@/domain/service-order/enterprise/entities/service-order-history'

export class PrismaServiceOrderHistoryMapper {
  static toDomain(raw: PrismaServiceOrderHistory): ServiceOrderHistory {
    return ServiceOrderHistory.create(
      {
        serviceOrderId: new UniqueEntityID(raw.serviceOrderId),
        userId: raw.userId ? new UniqueEntityID(raw.userId) : null,
        action: raw.action,
        description: raw.description,
        oldValue: raw.oldValue,
        newValue: raw.newValue,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    history: ServiceOrderHistory,
  ): Prisma.ServiceOrderHistoryUncheckedCreateInput {
    return {
      id: history.id.toString(),
      serviceOrderId: history.serviceOrderId.toString(),
      userId: history.userId?.toString(),
      action: history.action,
      description: history.description,
      oldValue: history.oldValue,
      newValue: history.newValue,
      createdAt: history.createdAt,
    }
  }
}
