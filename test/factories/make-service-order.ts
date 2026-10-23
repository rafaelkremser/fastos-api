import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ServiceOrder,
  ServiceOrderProps,
} from '@/domain/service-order/enterprise/entities/service-order'

export function makeServiceOrder(
  override: Partial<ServiceOrderProps> = {},
  id?: UniqueEntityID,
) {
  return ServiceOrder.create(
    {
      tenantId: new UniqueEntityID(),
      customerId: new UniqueEntityID(),
      deviceId: new UniqueEntityID(),
      createdById: new UniqueEntityID(),
      number: 1,
      technicianId: null,
      problemDescription: 'Aparelho não liga',
      diagnosis: null,
      solution: null,
      estimatedDate: null,
      completedDate: null,
      deliveredDate: null,
      estimatedCost: null,
      finalCost: null,
      internalNotes: null,
      customerNotes: null,
      warrantyUntil: null,
      ...override,
    },
    id ?? new UniqueEntityID(),
  )
}
