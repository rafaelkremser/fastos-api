import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { ServiceOrder } from '../entities/service-order'

export class ServiceOrderCreatedEvent implements DomainEvent {
  public ocurredAt: Date
  public serviceOrder: ServiceOrder

  constructor(serviceOrder: ServiceOrder) {
    this.serviceOrder = serviceOrder
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.serviceOrder.id
  }
}
