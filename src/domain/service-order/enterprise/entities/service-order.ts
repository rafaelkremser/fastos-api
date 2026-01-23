import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { ServiceOrderItemList } from './service-order-item-list'
import { ServiceOrderStatusChangedEvent } from '../events/service-order-status-changed-event'
import { ServiceOrderCreatedEvent } from '../events/service-order-created-event'

export type OrderStatus =
  | 'OPEN'
  | 'IN_ANALYSIS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface ServiceOrderProps {
  tenantId: UniqueEntityID
  customerId: UniqueEntityID
  deviceId: UniqueEntityID
  number: number
  status: OrderStatus
  priority: OrderPriority
  technicianId: UniqueEntityID | null
  createdById: UniqueEntityID
  problemDescription: string
  diagnosis: string | null
  solution: string | null
  entryDate: Date
  estimatedDate: Date | null
  completedDate: Date | null
  deliveredDate: Date | null
  estimatedCost: number | null
  finalCost: number | null
  discount: number
  internalNotes: string | null
  customerNotes: string | null
  warrantyDays: number
  warrantyUntil: Date | null
  items: ServiceOrderItemList
  createdAt: Date
  updatedAt?: Date | null
}

export class ServiceOrder extends AggregateRoot<ServiceOrderProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get customerId() {
    return this.props.customerId
  }

  get deviceId() {
    return this.props.deviceId
  }

  get number() {
    return this.props.number
  }

  get status() {
    return this.props.status
  }

  get priority() {
    return this.props.priority
  }

  get technicianId() {
    return this.props.technicianId
  }

  get createdById() {
    return this.props.createdById
  }

  get problemDescription() {
    return this.props.problemDescription
  }

  get diagnosis() {
    return this.props.diagnosis
  }

  get solution() {
    return this.props.solution
  }

  get entryDate() {
    return this.props.entryDate
  }

  get estimatedDate() {
    return this.props.estimatedDate
  }

  get completedDate() {
    return this.props.completedDate
  }

  get deliveredDate() {
    return this.props.deliveredDate
  }

  get estimatedCost() {
    return this.props.estimatedCost
  }

  get finalCost() {
    return this.props.finalCost
  }

  get discount() {
    return this.props.discount
  }

  get internalNotes() {
    return this.props.internalNotes
  }

  get customerNotes() {
    return this.props.customerNotes
  }

  get warrantyDays() {
    return this.props.warrantyDays
  }

  get warrantyUntil() {
    return this.props.warrantyUntil
  }

  get items() {
    return this.props.items
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get totalItemsCost() {
    return this.items.getItems().reduce((sum, item) => sum + item.totalPrice, 0)
  }

  get totalWithDiscount() {
    const total = this.finalCost ?? this.estimatedCost ?? this.totalItemsCost
    return total - this.discount
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set status(status: OrderStatus) {
    const oldStatus = this.props.status

    if (oldStatus !== status) {
      this.props.status = status
      this.addDomainEvent(new ServiceOrderStatusChangedEvent(this, oldStatus))

      if (status === 'COMPLETED') {
        this.props.completedDate = new Date()
        this.props.warrantyUntil = new Date(
          Date.now() + this.warrantyDays * 24 * 60 * 60 * 1000,
        )
      }

      if (status === 'DELIVERED') {
        this.props.deliveredDate = new Date()
      }
    }

    this.touch()
  }

  set priority(priority: OrderPriority) {
    this.props.priority = priority
    this.touch()
  }

  set technicianId(technicianId: UniqueEntityID | null) {
    this.props.technicianId = technicianId
    this.touch()
  }

  set problemDescription(problemDescription: string) {
    this.props.problemDescription = problemDescription
    this.touch()
  }

  set diagnosis(diagnosis: string | null) {
    this.props.diagnosis = diagnosis
    this.touch()
  }

  set solution(solution: string | null) {
    this.props.solution = solution
    this.touch()
  }

  set estimatedDate(estimatedDate: Date | null) {
    this.props.estimatedDate = estimatedDate
    this.touch()
  }

  set estimatedCost(cost: number | null) {
    this.props.estimatedCost = cost
    this.touch()
  }

  set finalCost(cost: number | null) {
    this.props.finalCost = cost
    this.touch()
  }

  set discount(discount: number) {
    this.props.discount = discount
    this.touch()
  }

  set internalNotes(internalNotes: string | null) {
    this.props.internalNotes = internalNotes
    this.touch()
  }

  set customerNotes(customerNotes: string | null) {
    this.props.customerNotes = customerNotes
    this.touch()
  }

  set items(items: ServiceOrderItemList) {
    this.props.items = items
    this.touch()
  }

  static create(
    props: Optional<
      ServiceOrderProps,
      | 'status'
      | 'priority'
      | 'items'
      | 'discount'
      | 'warrantyDays'
      | 'entryDate'
      | 'createdAt'
    >,
    id?: UniqueEntityID,
  ) {
    const serviceOrder = new ServiceOrder(
      {
        ...props,
        status: props.status ?? 'OPEN',
        priority: props.priority ?? 'NORMAL',
        items: props.items ?? new ServiceOrderItemList(),
        discount: props.discount ?? 0,
        warrantyDays: props.warrantyDays ?? 90,
        entryDate: props.entryDate ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    const isNewServiceOrder = !id

    if (isNewServiceOrder) {
      serviceOrder.addDomainEvent(new ServiceOrderCreatedEvent(serviceOrder))
    }

    return serviceOrder
  }
}
