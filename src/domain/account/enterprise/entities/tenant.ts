import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface TenantProps {
  name: string
  document: string | null
  email: string
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
}

export class Tenant extends Entity<TenantProps> {
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

  get isActive() {
    return this.props.isActive
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

  set email(email: string) {
    this.props.email = email
    this.touch()
  }

  set phone(phone: string | null) {
    this.props.phone = phone
    this.touch()
  }

  set document(document: string | null) {
    this.props.document = document
    this.touch()
  }

  deactivate() {
    this.props.isActive = false
    this.touch()
  }

  activate() {
    this.props.isActive = true
    this.touch()
  }

  static create(
    props: Optional<TenantProps, 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new Tenant(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
