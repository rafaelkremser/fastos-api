import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { ServiceOrder, OrderStatus } from '../entities/service-order'

export class ServiceOrderStatusChangedEvent implements DomainEvent {
  public ocurredAt: Date
  public serviceOrder: ServiceOrder
  public oldStatus: OrderStatus

  constructor(serviceOrder: ServiceOrder, oldStatus: OrderStatus) {
    this.serviceOrder = serviceOrder
    this.oldStatus = oldStatus
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.serviceOrder.id
  }
}
