import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface ServiceOrderHistoryProps {
  serviceOrderId: UniqueEntityID
  userId: UniqueEntityID | null
  action: string
  description: string
  oldValue: string | null
  newValue: string | null
  createdAt: Date
}

export class ServiceOrderHistory extends Entity<ServiceOrderHistoryProps> {
  get serviceOrderId() {
    return this.props.serviceOrderId
  }

  get userId() {
    return this.props.userId
  }

  get action() {
    return this.props.action
  }

  get description() {
    return this.props.description
  }

  get oldValue() {
    return this.props.oldValue
  }

  get newValue() {
    return this.props.newValue
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<ServiceOrderHistoryProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new ServiceOrderHistory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
