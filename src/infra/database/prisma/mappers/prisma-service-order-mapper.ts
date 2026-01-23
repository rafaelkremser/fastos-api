import { Prisma, ServiceOrder as PrismaServiceOrder } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ServiceOrder,
  OrderStatus,
  OrderPriority,
} from '@/domain/service-order/enterprise/entities/service-order'
import { ServiceOrderItemList } from '@/domain/service-order/enterprise/entities/service-order-item-list'

export class PrismaServiceOrderMapper {
  static toDomain(raw: PrismaServiceOrder): ServiceOrder {
    return ServiceOrder.create(
      {
        tenantId: new UniqueEntityID(raw.tenantId),
        customerId: new UniqueEntityID(raw.customerId),
        deviceId: new UniqueEntityID(raw.deviceId),
        number: raw.number,
        status: raw.status as OrderStatus,
        priority: raw.priority as OrderPriority,
        technicianId: raw.technicianId
          ? new UniqueEntityID(raw.technicianId)
          : null,
        createdById: new UniqueEntityID(raw.createdById),
        problemDescription: raw.problemDescription,
        diagnosis: raw.diagnosis,
        solution: raw.solution,
        entryDate: raw.entryDate,
        estimatedDate: raw.estimatedDate,
        completedDate: raw.completedDate,
        deliveredDate: raw.deliveredDate,
        estimatedCost: raw.estimatedCost?.toNumber() ?? null,
        finalCost: raw.finalCost?.toNumber() ?? null,
        discount: raw.discount?.toNumber() ?? 0,
        internalNotes: raw.internalNotes,
        customerNotes: raw.customerNotes,
        warrantyDays: raw.warrantyDays ?? 90,
        warrantyUntil: raw.warrantyUntil,
        items: new ServiceOrderItemList(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    serviceOrder: ServiceOrder,
  ): Prisma.ServiceOrderUncheckedCreateInput {
    return {
      id: serviceOrder.id.toString(),
      tenantId: serviceOrder.tenantId.toString(),
      customerId: serviceOrder.customerId.toString(),
      deviceId: serviceOrder.deviceId.toString(),
      number: serviceOrder.number,
      status: serviceOrder.status,
      priority: serviceOrder.priority,
      technicianId: serviceOrder.technicianId?.toString(),
      createdById: serviceOrder.createdById.toString(),
      problemDescription: serviceOrder.problemDescription,
      diagnosis: serviceOrder.diagnosis,
      solution: serviceOrder.solution,
      entryDate: serviceOrder.entryDate,
      estimatedDate: serviceOrder.estimatedDate,
      completedDate: serviceOrder.completedDate,
      deliveredDate: serviceOrder.deliveredDate,
      estimatedCost: serviceOrder.estimatedCost,
      finalCost: serviceOrder.finalCost,
      discount: serviceOrder.discount,
      internalNotes: serviceOrder.internalNotes,
      customerNotes: serviceOrder.customerNotes,
      warrantyDays: serviceOrder.warrantyDays,
      warrantyUntil: serviceOrder.warrantyUntil,
      createdAt: serviceOrder.createdAt,
      updatedAt: serviceOrder.updatedAt,
    }
  }
}
