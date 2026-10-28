import { Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  OrderPriority,
  OrderStatus,
} from '@/domain/service-order/enterprise/entities/service-order'
import { ServiceOrderSummary } from '@/domain/service-order/enterprise/entities/value-objects/service-order-summary'

// Only the columns a summary shows, so the list does not read whole customers
export const serviceOrderSummaryInclude = {
  customer: { select: { name: true, phone: true } },
  device: { select: { type: true, brand: true, model: true } },
  technician: { select: { name: true } },
} satisfies Prisma.ServiceOrderInclude

type PrismaServiceOrderSummary = Prisma.ServiceOrderGetPayload<{
  include: typeof serviceOrderSummaryInclude
}>

export class PrismaServiceOrderSummaryMapper {
  static toDomain(raw: PrismaServiceOrderSummary): ServiceOrderSummary {
    return ServiceOrderSummary.create({
      serviceOrderId: new UniqueEntityID(raw.id),
      number: raw.number,
      status: raw.status as OrderStatus,
      priority: raw.priority as OrderPriority,
      customerId: new UniqueEntityID(raw.customerId),
      customerName: raw.customer.name,
      customerPhone: raw.customer.phone,
      deviceId: new UniqueEntityID(raw.deviceId),
      deviceType: raw.device.type,
      deviceBrand: raw.device.brand,
      deviceModel: raw.device.model,
      technicianId: raw.technicianId
        ? new UniqueEntityID(raw.technicianId)
        : null,
      technicianName: raw.technician?.name ?? null,
      entryDate: raw.entryDate,
      estimatedDate: raw.estimatedDate,
      createdAt: raw.createdAt,
    })
  }
}
