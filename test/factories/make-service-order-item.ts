import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  ServiceOrderItem,
  ServiceOrderItemProps,
} from '@/domain/service-order/enterprise/entities/service-order-item'

export function makeServiceOrderItem(
  override: Partial<ServiceOrderItemProps> = {},
  id?: UniqueEntityID,
) {
  return ServiceOrderItem.create(
    {
      serviceOrderId: new UniqueEntityID(),
      type: 'PART',
      description: 'Tela',
      quantity: 1,
      unitPrice: 100,
      ...override,
    },
    id,
  )
}
