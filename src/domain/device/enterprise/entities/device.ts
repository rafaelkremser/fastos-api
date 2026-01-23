import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface DeviceProps {
  tenantId: UniqueEntityID
  customerId: UniqueEntityID
  type: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  imei: string | null
  color: string | null
  condition: string | null
  accessories: string | null
  notes: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export class Device extends Entity<DeviceProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get customerId() {
    return this.props.customerId
  }

  get type() {
    return this.props.type
  }

  get brand() {
    return this.props.brand
  }

  get model() {
    return this.props.model
  }

  get serialNumber() {
    return this.props.serialNumber
  }

  get imei() {
    return this.props.imei
  }

  get color() {
    return this.props.color
  }

  get condition() {
    return this.props.condition
  }

  get accessories() {
    return this.props.accessories
  }

  get notes() {
    return this.props.notes
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get fullDescription() {
    const parts = [this.type, this.brand, this.model].filter(Boolean)
    return parts.join(' ')
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set type(type: string) {
    this.props.type = type
    this.touch()
  }

  set brand(brand: string | null) {
    this.props.brand = brand
    this.touch()
  }

  set model(model: string | null) {
    this.props.model = model
    this.touch()
  }

  set serialNumber(serialNumber: string | null) {
    this.props.serialNumber = serialNumber
    this.touch()
  }

  set imei(imei: string | null) {
    this.props.imei = imei
    this.touch()
  }

  set color(color: string | null) {
    this.props.color = color
    this.touch()
  }

  set condition(condition: string | null) {
    this.props.condition = condition
    this.touch()
  }

  set accessories(accessories: string | null) {
    this.props.accessories = accessories
    this.touch()
  }

  set notes(notes: string | null) {
    this.props.notes = notes
    this.touch()
  }

  static create(
    props: Optional<DeviceProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new Device(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
