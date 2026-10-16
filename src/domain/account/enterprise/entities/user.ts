import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export const USER_ROLES = [
  'OWNER',
  'ADMIN',
  'TECHNICIAN',
  'RECEPTIONIST',
] as const

export type UserRole = (typeof USER_ROLES)[number]

// Roles a user may give to a new teammate. Nobody creates a second owner,
// and an admin cannot create other admins.
const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  OWNER: ['ADMIN', 'TECHNICIAN', 'RECEPTIONIST'],
  ADMIN: ['TECHNICIAN', 'RECEPTIONIST'],
  TECHNICIAN: [],
  RECEPTIONIST: [],
}

export interface UserProps {
  tenantId: UniqueEntityID
  name: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
}

export class User extends Entity<UserProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  get password() {
    return this.props.password
  }

  get role() {
    return this.props.role
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

  set password(password: string) {
    this.props.password = password
    this.touch()
  }

  set role(role: UserRole) {
    this.props.role = role
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

  canAssignRole(role: UserRole) {
    return ASSIGNABLE_ROLES[this.role].includes(role)
  }

  static create(
    props: Optional<UserProps, 'role' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new User(
      {
        ...props,
        role: props.role ?? 'TECHNICIAN',
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
