import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export type ItemType = 'SERVICE' | 'PART' | 'OTHER'

export interface ServiceOrderItemProps {
  serviceOrderId: UniqueEntityID
  type: ItemType
  description: string
  quantity: number
  unitPrice: number
  createdAt: Date
}

export class ServiceOrderItem extends Entity<ServiceOrderItemProps> {
  get serviceOrderId() {
    return this.props.serviceOrderId
  }

  get type() {
    return this.props.type
  }

  get description() {
    return this.props.description
  }

  get quantity() {
    return this.props.quantity
  }

  get unitPrice() {
    return this.props.unitPrice
  }

  get createdAt() {
    return this.props.createdAt
  }

  get totalPrice() {
    return this.quantity * this.unitPrice
  }

  set type(type: ItemType) {
    this.props.type = type
  }

  set description(description: string) {
    this.props.description = description
  }

  set quantity(quantity: number) {
    this.props.quantity = quantity
  }

  set unitPrice(unitPrice: number) {
    this.props.unitPrice = unitPrice
  }

  static create(
    props: Optional<ServiceOrderItemProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new ServiceOrderItem(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
