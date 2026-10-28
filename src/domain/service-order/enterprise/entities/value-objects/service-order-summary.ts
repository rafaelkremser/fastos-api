import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ValueObject } from '@/core/entities/value-object'
import {
  CUSTOMER_NOTICE_STATUSES,
  OrderPriority,
  OrderStatus,
} from '../service-order'

export interface ServiceOrderSummaryProps {
  serviceOrderId: UniqueEntityID
  number: number
  status: OrderStatus
  priority: OrderPriority
  customerId: UniqueEntityID
  customerName: string
  customerPhone: string
  deviceId: UniqueEntityID
  deviceType: string
  deviceBrand: string | null
  deviceModel: string | null
  technicianId: UniqueEntityID | null
  technicianName: string | null
  entryDate: Date
  estimatedDate: Date | null
  customerNotifiedAt: Date | null
  createdAt: Date
}

// A line of the service order list: the order with the names a person
// recognizes, instead of the ids of its customer, device and technician
export class ServiceOrderSummary extends ValueObject<ServiceOrderSummaryProps> {
  get serviceOrderId() {
    return this.props.serviceOrderId
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

  get customerId() {
    return this.props.customerId
  }

  get customerName() {
    return this.props.customerName
  }

  get customerPhone() {
    return this.props.customerPhone
  }

  get deviceId() {
    return this.props.deviceId
  }

  get deviceType() {
    return this.props.deviceType
  }

  get deviceBrand() {
    return this.props.deviceBrand
  }

  get deviceModel() {
    return this.props.deviceModel
  }

  get technicianId() {
    return this.props.technicianId
  }

  get technicianName() {
    return this.props.technicianName
  }

  get entryDate() {
    return this.props.entryDate
  }

  get estimatedDate() {
    return this.props.estimatedDate
  }

  get customerNotifiedAt() {
    return this.props.customerNotifiedAt
  }

  // Same rule as the order's
  get needsCustomerNotice() {
    return (
      CUSTOMER_NOTICE_STATUSES.includes(this.status) && !this.customerNotifiedAt
    )
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(props: ServiceOrderSummaryProps) {
    return new ServiceOrderSummary(props)
  }
}
