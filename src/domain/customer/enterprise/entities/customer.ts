import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface CustomerProps {
  tenantId: UniqueEntityID
  name: string
  document: string | null
  email: string | null
  phone: string
  phone2: string | null
  address: string | null
  addressNumber: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  notes: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export class Customer extends Entity<CustomerProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get name() {
    return this.props.name
  }

  get document() {
    return this.props.document
  }

  get email() {
    return this.props.email
  }

  get phone() {
    return this.props.phone
  }

  get phone2() {
    return this.props.phone2
  }

  get address() {
    return this.props.address
  }

  get addressNumber() {
    return this.props.addressNumber
  }

  get complement() {
    return this.props.complement
  }

  get neighborhood() {
    return this.props.neighborhood
  }

  get city() {
    return this.props.city
  }

  get state() {
    return this.props.state
  }

  get zipCode() {
    return this.props.zipCode
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

  private touch() {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set document(document: string | null) {
    this.props.document = document
    this.touch()
  }

  set email(email: string | null) {
    this.props.email = email
    this.touch()
  }

  set phone(phone: string) {
    this.props.phone = phone
    this.touch()
  }

  set phone2(phone2: string | null) {
    this.props.phone2 = phone2
    this.touch()
  }

  set address(address: string | null) {
    this.props.address = address
    this.touch()
  }

  set addressNumber(addressNumber: string | null) {
    this.props.addressNumber = addressNumber
    this.touch()
  }

  set complement(complement: string | null) {
    this.props.complement = complement
    this.touch()
  }

  set neighborhood(neighborhood: string | null) {
    this.props.neighborhood = neighborhood
    this.touch()
  }

  set city(city: string | null) {
    this.props.city = city
    this.touch()
  }

  set state(state: string | null) {
    this.props.state = state
    this.touch()
  }

  set zipCode(zipCode: string | null) {
    this.props.zipCode = zipCode
    this.touch()
  }

  set notes(notes: string | null) {
    this.props.notes = notes
    this.touch()
  }

  static create(
    props: Optional<CustomerProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new Customer(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
