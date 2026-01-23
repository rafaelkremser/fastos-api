# Arquitetura - SaaS Multi-Tenant de Ordens de Serviço

## 1. Visão Geral

Sistema SaaS para gestão de ordens de serviço voltado para assistências técnicas. Arquitetura baseada em **Clean Architecture**, **DDD** e princípios **SOLID**.

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | NestJS + TypeScript |
| **Frontend** | React + Vite + TypeScript |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticação** | JWT (RS256) |
| **Validação** | Zod |
| **Testes** | Vitest |
| **Container** | Docker |

---

## 2. Estrutura de Pastas

```
src/
├── core/                           # Blocos fundamentais (agnóstico ao domínio)
│   ├── entities/
│   │   ├── entity.ts               # Classe base para entidades
│   │   ├── aggregate-root.ts       # Entidade com domain events
│   │   ├── unique-entity-id.ts     # Value object para IDs
│   │   ├── value-object.ts         # Classe base para value objects
│   │   └── watched-list.ts         # Lista observável para agregados
│   ├── errors/
│   │   ├── use-case-error.ts       # Interface base de erro
│   │   └── errors/
│   │       ├── resource-not-found-error.ts
│   │       └── not-allowed-error.ts
│   ├── events/
│   │   ├── domain-event.ts
│   │   ├── domain-events.ts
│   │   └── event-handler.ts
│   ├── repositories/
│   │   └── pagination-params.ts
│   ├── types/
│   │   └── optional.ts
│   └── either.ts                   # Pattern Either (Left/Right)
│
├── domain/                         # Regras de negócio puras
│   ├── account/                    # Bounded Context: Contas e Tenants
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── register-tenant.ts
│   │   │   │   ├── authenticate-user.ts
│   │   │   │   ├── create-user.ts
│   │   │   │   └── ...
│   │   │   ├── repositories/
│   │   │   │   ├── tenants-repository.ts
│   │   │   │   └── users-repository.ts
│   │   │   └── cryptography/
│   │   │       ├── hasher.ts
│   │   │       └── encrypter.ts
│   │   └── enterprise/
│   │       ├── entities/
│   │       │   ├── tenant.ts
│   │       │   ├── user.ts
│   │       │   └── value-objects/
│   │       │       └── slug.ts
│   │       └── events/
│   │
│   ├── customer/                   # Bounded Context: Clientes
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-customer.ts
│   │   │   │   ├── edit-customer.ts
│   │   │   │   ├── delete-customer.ts
│   │   │   │   ├── get-customer.ts
│   │   │   │   └── fetch-customers.ts
│   │   │   └── repositories/
│   │   │       └── customers-repository.ts
│   │   └── enterprise/
│   │       └── entities/
│   │           ├── customer.ts
│   │           └── value-objects/
│   │               ├── phone.ts
│   │               ├── document.ts
│   │               └── address.ts
│   │
│   ├── device/                     # Bounded Context: Aparelhos
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-device.ts
│   │   │   │   ├── edit-device.ts
│   │   │   │   ├── delete-device.ts
│   │   │   │   └── fetch-devices-by-customer.ts
│   │   │   └── repositories/
│   │   │       └── devices-repository.ts
│   │   └── enterprise/
│   │       └── entities/
│   │           └── device.ts
│   │
│   ├── service-order/              # Bounded Context: Ordens de Serviço
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-service-order.ts
│   │   │   │   ├── edit-service-order.ts
│   │   │   │   ├── change-service-order-status.ts
│   │   │   │   ├── add-service-order-item.ts
│   │   │   │   ├── remove-service-order-item.ts
│   │   │   │   ├── assign-technician.ts
│   │   │   │   ├── get-service-order.ts
│   │   │   │   ├── fetch-service-orders.ts
│   │   │   │   └── fetch-service-order-history.ts
│   │   │   └── repositories/
│   │   │       ├── service-orders-repository.ts
│   │   │       ├── service-order-items-repository.ts
│   │   │       └── service-order-history-repository.ts
│   │   └── enterprise/
│   │       ├── entities/
│   │       │   ├── service-order.ts
│   │       │   ├── service-order-item.ts
│   │       │   ├── service-order-item-list.ts
│   │       │   ├── service-order-history.ts
│   │       │   └── value-objects/
│   │       │       ├── order-number.ts
│   │       │       └── money.ts
│   │       └── events/
│   │           ├── service-order-created-event.ts
│   │           └── service-order-status-changed-event.ts
│   │
│   └── notification/               # Bounded Context: Notificações
│       ├── application/
│       │   ├── use-cases/
│       │   │   ├── send-notification.ts
│       │   │   └── read-notification.ts
│       │   └── repositories/
│       │       └── notifications-repository.ts
│       └── enterprise/
│           └── entities/
│               └── notification.ts
│
└── infra/                          # Implementações e frameworks
    ├── app.module.ts
    ├── main.ts
    │
    ├── auth/
    │   ├── auth.module.ts
    │   ├── jwt.strategy.ts
    │   ├── jwt-auth.guard.ts
    │   ├── current-user-decorator.ts
    │   └── public.ts
    │
    ├── cryptography/
    │   ├── cryptography.module.ts
    │   ├── bcrypt-hasher.ts
    │   └── jwt-encrypter.ts
    │
    ├── database/
    │   ├── database.module.ts
    │   └── prisma/
    │       ├── prisma.service.ts
    │       ├── mappers/
    │       │   ├── prisma-tenant-mapper.ts
    │       │   ├── prisma-user-mapper.ts
    │       │   ├── prisma-customer-mapper.ts
    │       │   ├── prisma-device-mapper.ts
    │       │   ├── prisma-service-order-mapper.ts
    │       │   └── ...
    │       └── repositories/
    │           ├── prisma-tenants-repository.ts
    │           ├── prisma-users-repository.ts
    │           ├── prisma-customers-repository.ts
    │           ├── prisma-devices-repository.ts
    │           ├── prisma-service-orders-repository.ts
    │           └── ...
    │
    ├── env/
    │   ├── env.module.ts
    │   ├── env.service.ts
    │   └── env.ts
    │
    ├── events/
    │   ├── events.module.ts
    │   └── on-service-order-status-changed.ts
    │
    └── http/
        ├── http.module.ts
        ├── controllers/
        │   ├── authenticate.controller.ts
        │   ├── create-account.controller.ts
        │   ├── create-customer.controller.ts
        │   ├── create-device.controller.ts
        │   ├── create-service-order.controller.ts
        │   ├── change-service-order-status.controller.ts
        │   └── ...
        ├── pipes/
        │   └── zod-validation-pipe.ts
        └── presenters/
            ├── customer-presenter.ts
            ├── device-presenter.ts
            ├── service-order-presenter.ts
            └── ...
```

---

## 3. Core - Blocos Fundamentais

### 3.1 Entity

```typescript
// src/core/entities/entity.ts
import { UniqueEntityID } from './unique-entity-id'

export abstract class Entity<Props> {
  private _id: UniqueEntityID
  protected props: Props

  get id() {
    return this._id
  }

  protected constructor(props: Props, id?: UniqueEntityID) {
    this.props = props
    this._id = id ?? new UniqueEntityID()
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) return true
    if (entity.id === this.id) return true
    return false
  }
}
```

### 3.2 UniqueEntityID

```typescript
// src/core/entities/unique-entity-id.ts
import { randomUUID } from 'crypto'

export class UniqueEntityID {
  private value: string

  toString() {
    return this.value
  }

  toValue() {
    return this.value
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }

  equals(id: UniqueEntityID) {
    return id.toValue() === this.value
  }
}
```

### 3.3 AggregateRoot

```typescript
// src/core/entities/aggregate-root.ts
import { DomainEvent } from '../events/domain-event'
import { DomainEvents } from '../events/domain-events'
import { Entity } from './entity'

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
    DomainEvents.markAggregateForDispatch(this)
  }

  public clearEvents() {
    this._domainEvents = []
  }
}
```

### 3.4 ValueObject

```typescript
// src/core/entities/value-object.ts
export abstract class ValueObject<Props> {
  protected props: Props

  protected constructor(props: Props) {
    this.props = props
  }

  public equals(vo: ValueObject<unknown>) {
    if (vo === null || vo === undefined) return false
    if (vo.props === undefined) return false
    return JSON.stringify(vo.props) === JSON.stringify(this.props)
  }
}
```

### 3.5 Either

```typescript
// src/core/either.ts
export class Left<L, R> {
  readonly value: L

  constructor(value: L) {
    this.value = value
  }

  isRight(): this is Right<L, R> {
    return false
  }

  isLeft(): this is Left<L, R> {
    return true
  }
}

export class Right<L, R> {
  readonly value: R

  constructor(value: R) {
    this.value = value
  }

  isRight(): this is Right<L, R> {
    return true
  }

  isLeft(): this is Left<L, R> {
    return false
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>

export const left = <L, R>(value: L): Either<L, R> => new Left(value)
export const right = <L, R>(value: R): Either<L, R> => new Right(value)
```

### 3.6 Erros

```typescript
// src/core/errors/use-case-error.ts
export interface UseCaseError {
  message: string
}

// src/core/errors/errors/resource-not-found-error.ts
import { UseCaseError } from '@/core/errors/use-case-error'

export class ResourceNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Resource not found')
  }
}

// src/core/errors/errors/not-allowed-error.ts
import { UseCaseError } from '@/core/errors/use-case-error'

export class NotAllowedError extends Error implements UseCaseError {
  constructor() {
    super('Not allowed')
  }
}
```

---

## 4. Domain - Entidades

### 4.1 Tenant

```typescript
// src/domain/account/enterprise/entities/tenant.ts
import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Slug } from './value-objects/slug'

export interface TenantProps {
  name: string
  slug: Slug
  document: string | null
  email: string
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt?: Date | null
}

export class Tenant extends Entity<TenantProps> {
  get name() { return this.props.name }
  get slug() { return this.props.slug }
  get document() { return this.props.document }
  get email() { return this.props.email }
  get phone() { return this.props.phone }
  get isActive() { return this.props.isActive }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.props.slug = Slug.createFromText(name)
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
    props: Optional<TenantProps, 'slug' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new Tenant(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.name),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
```

### 4.2 User

```typescript
// src/domain/account/enterprise/entities/user.ts
import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export type UserRole = 'OWNER' | 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST'

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
  get tenantId() { return this.props.tenantId }
  get name() { return this.props.name }
  get email() { return this.props.email }
  get password() { return this.props.password }
  get role() { return this.props.role }
  get isActive() { return this.props.isActive }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set password(password: string) {
    this.props.password = password
    this.touch()
  }

  static create(
    props: Optional<UserProps, 'role' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new User(
      {
        ...props,
        role: props.role ?? 'TECHNICIAN',
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
```

### 4.3 Customer

```typescript
// src/domain/customer/enterprise/entities/customer.ts
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
  get tenantId() { return this.props.tenantId }
  get name() { return this.props.name }
  get document() { return this.props.document }
  get email() { return this.props.email }
  get phone() { return this.props.phone }
  get phone2() { return this.props.phone2 }
  get address() { return this.props.address }
  get addressNumber() { return this.props.addressNumber }
  get complement() { return this.props.complement }
  get neighborhood() { return this.props.neighborhood }
  get city() { return this.props.city }
  get state() { return this.props.state }
  get zipCode() { return this.props.zipCode }
  get notes() { return this.props.notes }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set phone(phone: string) {
    this.props.phone = phone
    this.touch()
  }

  set email(email: string | null) {
    this.props.email = email
    this.touch()
  }

  static create(
    props: Optional<CustomerProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new Customer(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
```

### 4.4 Device

```typescript
// src/domain/device/enterprise/entities/device.ts
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
  get tenantId() { return this.props.tenantId }
  get customerId() { return this.props.customerId }
  get type() { return this.props.type }
  get brand() { return this.props.brand }
  get model() { return this.props.model }
  get serialNumber() { return this.props.serialNumber }
  get imei() { return this.props.imei }
  get color() { return this.props.color }
  get condition() { return this.props.condition }
  get accessories() { return this.props.accessories }
  get notes() { return this.props.notes }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  get fullDescription() {
    const parts = [this.type, this.brand, this.model].filter(Boolean)
    return parts.join(' ')
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<DeviceProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    return new Device(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
```

### 4.5 ServiceOrder (Aggregate Root)

```typescript
// src/domain/service-order/enterprise/entities/service-order.ts
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { ServiceOrderItemList } from './service-order-item-list'
import { ServiceOrderStatusChangedEvent } from '../events/service-order-status-changed-event'

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
  get tenantId() { return this.props.tenantId }
  get customerId() { return this.props.customerId }
  get deviceId() { return this.props.deviceId }
  get number() { return this.props.number }
  get status() { return this.props.status }
  get priority() { return this.props.priority }
  get technicianId() { return this.props.technicianId }
  get createdById() { return this.props.createdById }
  get problemDescription() { return this.props.problemDescription }
  get diagnosis() { return this.props.diagnosis }
  get solution() { return this.props.solution }
  get entryDate() { return this.props.entryDate }
  get estimatedDate() { return this.props.estimatedDate }
  get completedDate() { return this.props.completedDate }
  get deliveredDate() { return this.props.deliveredDate }
  get estimatedCost() { return this.props.estimatedCost }
  get finalCost() { return this.props.finalCost }
  get discount() { return this.props.discount }
  get internalNotes() { return this.props.internalNotes }
  get customerNotes() { return this.props.customerNotes }
  get warrantyDays() { return this.props.warrantyDays }
  get warrantyUntil() { return this.props.warrantyUntil }
  get items() { return this.props.items }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

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
          Date.now() + this.warrantyDays * 24 * 60 * 60 * 1000
        )
      }

      if (status === 'DELIVERED') {
        this.props.deliveredDate = new Date()
      }
    }

    this.touch()
  }

  set technicianId(technicianId: UniqueEntityID | null) {
    this.props.technicianId = technicianId
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

  set items(items: ServiceOrderItemList) {
    this.props.items = items
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
    id?: UniqueEntityID
  ) {
    return new ServiceOrder(
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
      id
    )
  }
}
```

### 4.6 ServiceOrderItem

```typescript
// src/domain/service-order/enterprise/entities/service-order-item.ts
import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

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
  get serviceOrderId() { return this.props.serviceOrderId }
  get type() { return this.props.type }
  get description() { return this.props.description }
  get quantity() { return this.props.quantity }
  get unitPrice() { return this.props.unitPrice }
  get createdAt() { return this.props.createdAt }

  get totalPrice() {
    return this.quantity * this.unitPrice
  }

  static create(props: ServiceOrderItemProps, id?: UniqueEntityID) {
    return new ServiceOrderItem(props, id)
  }
}
```

---

## 5. Domain - Repositories (Interfaces)

```typescript
// src/domain/account/application/repositories/tenants-repository.ts
import { Tenant } from '../../enterprise/entities/tenant'

export abstract class TenantsRepository {
  abstract findById(id: string): Promise<Tenant | null>
  abstract findBySlug(slug: string): Promise<Tenant | null>
  abstract findByEmail(email: string): Promise<Tenant | null>
  abstract create(tenant: Tenant): Promise<void>
  abstract save(tenant: Tenant): Promise<void>
}

// src/domain/account/application/repositories/users-repository.ts
import { User } from '../../enterprise/entities/user'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(tenantId: string, email: string): Promise<User | null>
  abstract findManyByTenantId(tenantId: string): Promise<User[]>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}

// src/domain/customer/application/repositories/customers-repository.ts
import { PaginationParams } from '@/core/repositories/pagination-params'
import { Customer } from '../../enterprise/entities/customer'

export abstract class CustomersRepository {
  abstract findById(id: string): Promise<Customer | null>
  abstract findByPhone(tenantId: string, phone: string): Promise<Customer | null>
  abstract findMany(tenantId: string, params: PaginationParams): Promise<Customer[]>
  abstract searchByName(tenantId: string, name: string, params: PaginationParams): Promise<Customer[]>
  abstract create(customer: Customer): Promise<void>
  abstract save(customer: Customer): Promise<void>
  abstract delete(customer: Customer): Promise<void>
}

// src/domain/service-order/application/repositories/service-orders-repository.ts
import { PaginationParams } from '@/core/repositories/pagination-params'
import { ServiceOrder } from '../../enterprise/entities/service-order'

export interface ServiceOrderFilters {
  status?: string
  technicianId?: string
  customerId?: string
  startDate?: Date
  endDate?: Date
}

export abstract class ServiceOrdersRepository {
  abstract findById(id: string): Promise<ServiceOrder | null>
  abstract findByNumber(tenantId: string, number: number): Promise<ServiceOrder | null>
  abstract findMany(
    tenantId: string,
    filters: ServiceOrderFilters,
    params: PaginationParams
  ): Promise<ServiceOrder[]>
  abstract countByStatus(tenantId: string): Promise<Record<string, number>>
  abstract getNextNumber(tenantId: string): Promise<number>
  abstract create(serviceOrder: ServiceOrder): Promise<void>
  abstract save(serviceOrder: ServiceOrder): Promise<void>
  abstract delete(serviceOrder: ServiceOrder): Promise<void>
}
```

---

## 6. Domain - Use Cases

### 6.1 Exemplo: CreateServiceOrder

```typescript
// src/domain/service-order/application/use-cases/create-service-order.ts
import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ServiceOrder } from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'

interface CreateServiceOrderUseCaseRequest {
  tenantId: string
  customerId: string
  deviceId: string
  createdById: string
  problemDescription: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  estimatedDate?: Date
  internalNotes?: string
}

type CreateServiceOrderUseCaseResponse = Either<
  ResourceNotFoundError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class CreateServiceOrderUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private customersRepository: CustomersRepository,
    private devicesRepository: DevicesRepository
  ) {}

  async execute({
    tenantId,
    customerId,
    deviceId,
    createdById,
    problemDescription,
    priority,
    estimatedDate,
    internalNotes,
  }: CreateServiceOrderUseCaseRequest): Promise<CreateServiceOrderUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer || customer.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const device = await this.devicesRepository.findById(deviceId)

    if (!device || device.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const number = await this.serviceOrdersRepository.getNextNumber(tenantId)

    const serviceOrder = ServiceOrder.create({
      tenantId: new UniqueEntityID(tenantId),
      customerId: new UniqueEntityID(customerId),
      deviceId: new UniqueEntityID(deviceId),
      createdById: new UniqueEntityID(createdById),
      number,
      problemDescription,
      priority,
      estimatedDate: estimatedDate ?? null,
      internalNotes: internalNotes ?? null,
      technicianId: null,
      diagnosis: null,
      solution: null,
      completedDate: null,
      deliveredDate: null,
      estimatedCost: null,
      finalCost: null,
      customerNotes: null,
      warrantyUntil: null,
    })

    await this.serviceOrdersRepository.create(serviceOrder)

    return right({ serviceOrder })
  }
}
```

### 6.2 Exemplo: ChangeServiceOrderStatus

```typescript
// src/domain/service-order/application/use-cases/change-service-order-status.ts
import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ServiceOrder, OrderStatus } from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface ChangeServiceOrderStatusUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  userId: string
  newStatus: OrderStatus
  notes?: string
}

type ChangeServiceOrderStatusUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class ChangeServiceOrderStatusUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private historyRepository: ServiceOrderHistoryRepository
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    userId,
    newStatus,
    notes,
  }: ChangeServiceOrderStatusUseCaseRequest): Promise<ChangeServiceOrderStatusUseCaseResponse> {
    const serviceOrder = await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder || serviceOrder.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const oldStatus = serviceOrder.status
    serviceOrder.status = newStatus

    await this.serviceOrdersRepository.save(serviceOrder)

    // Registrar histórico
    const history = ServiceOrderHistory.create({
      serviceOrderId: new UniqueEntityID(serviceOrderId),
      userId: new UniqueEntityID(userId),
      action: 'STATUS_CHANGED',
      description: `Status alterado de ${oldStatus} para ${newStatus}`,
      oldValue: oldStatus,
      newValue: newStatus,
    })

    await this.historyRepository.create(history)

    return right({ serviceOrder })
  }
}
```

---

## 7. Infra - Mappers

```typescript
// src/infra/database/prisma/mappers/prisma-service-order-mapper.ts
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'
import { Prisma, ServiceOrder as PrismaServiceOrder } from '@prisma/client'

export class PrismaServiceOrderMapper {
  static toDomain(raw: PrismaServiceOrder): ServiceOrder {
    return ServiceOrder.create(
      {
        tenantId: new UniqueEntityID(raw.tenantId),
        customerId: new UniqueEntityID(raw.customerId),
        deviceId: new UniqueEntityID(raw.deviceId),
        number: raw.number,
        status: raw.status as any,
        priority: raw.priority as any,
        technicianId: raw.technicianId ? new UniqueEntityID(raw.technicianId) : null,
        createdById: new UniqueEntityID(raw.createdById),
        problemDescription: raw.problemDescription,
        diagnosis: raw.diagnosis,
        solution: raw.solution,
        entryDate: raw.entryDate,
        estimatedDate: raw.estimatedDate,
        completedDate: raw.completedDate,
        deliveredDate: raw.deliveredDate,
        estimatedCost: raw.estimatedCost?.toNumber() ?? null,
        finalCost: raw.finalCost?.toNumber() ?? null,
        discount: raw.discount?.toNumber() ?? 0,
        internalNotes: raw.internalNotes,
        customerNotes: raw.customerNotes,
        warrantyDays: raw.warrantyDays ?? 90,
        warrantyUntil: raw.warrantyUntil,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toPrisma(serviceOrder: ServiceOrder): Prisma.ServiceOrderUncheckedCreateInput {
    return {
      id: serviceOrder.id.toString(),
      tenantId: serviceOrder.tenantId.toString(),
      customerId: serviceOrder.customerId.toString(),
      deviceId: serviceOrder.deviceId.toString(),
      number: serviceOrder.number,
      status: serviceOrder.status,
      priority: serviceOrder.priority,
      technicianId: serviceOrder.technicianId?.toString(),
      createdById: serviceOrder.createdById.toString(),
      problemDescription: serviceOrder.problemDescription,
      diagnosis: serviceOrder.diagnosis,
      solution: serviceOrder.solution,
      entryDate: serviceOrder.entryDate,
      estimatedDate: serviceOrder.estimatedDate,
      completedDate: serviceOrder.completedDate,
      deliveredDate: serviceOrder.deliveredDate,
      estimatedCost: serviceOrder.estimatedCost,
      finalCost: serviceOrder.finalCost,
      discount: serviceOrder.discount,
      internalNotes: serviceOrder.internalNotes,
      customerNotes: serviceOrder.customerNotes,
      warrantyDays: serviceOrder.warrantyDays,
      warrantyUntil: serviceOrder.warrantyUntil,
      createdAt: serviceOrder.createdAt,
      updatedAt: serviceOrder.updatedAt,
    }
  }
}
```

---

## 8. Infra - Controllers

```typescript
// src/infra/http/controllers/create-service-order.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateServiceOrderUseCase } from '@/domain/service-order/application/use-cases/create-service-order'

const createServiceOrderBodySchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  problemDescription: z.string().min(10),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  estimatedDate: z.coerce.date().optional(),
  internalNotes: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(createServiceOrderBodySchema)

type CreateServiceOrderBodySchema = z.infer<typeof createServiceOrderBodySchema>

@Controller('/service-orders')
export class CreateServiceOrderController {
  constructor(private createServiceOrder: CreateServiceOrderUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: CreateServiceOrderBodySchema,
    @CurrentUser() user: UserPayload
  ) {
    const result = await this.createServiceOrder.execute({
      tenantId: user.tenantId,
      createdById: user.sub,
      ...body,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      serviceOrderId: result.value.serviceOrder.id.toString(),
      number: result.value.serviceOrder.number,
    }
  }
}
```

---

## 9. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// TENANT & AUTH
// ============================================

model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  document  String?
  email     String   @unique
  phone     String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")

  users         User[]
  customers     Customer[]
  devices       Device[]
  serviceOrders ServiceOrder[]

  @@map("tenants")
}

enum UserRole {
  OWNER
  ADMIN
  TECHNICIAN
  RECEPTIONIST
}

model User {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  name      String
  email     String
  password  String
  role      UserRole @default(TECHNICIAN)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")

  tenant              Tenant              @relation(fields: [tenantId], references: [id])
  assignedOrders      ServiceOrder[]      @relation("AssignedTechnician")
  createdOrders       ServiceOrder[]      @relation("CreatedBy")
  serviceOrderHistory ServiceOrderHistory[]

  @@unique([tenantId, email])
  @@map("users")
}

// ============================================
// CUSTOMERS & DEVICES
// ============================================

model Customer {
  id            String   @id @default(uuid())
  tenantId      String   @map("tenant_id")
  name          String
  document      String?
  email         String?
  phone         String
  phone2        String?  @map("phone_2")
  address       String?
  addressNumber String?  @map("address_number")
  complement    String?
  neighborhood  String?
  city          String?
  state         String?
  zipCode       String?  @map("zip_code")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")

  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  devices       Device[]
  serviceOrders ServiceOrder[]

  @@index([tenantId, phone])
  @@index([tenantId, name])
  @@map("customers")
}

model Device {
  id           String   @id @default(uuid())
  tenantId     String   @map("tenant_id")
  customerId   String   @map("customer_id")
  type         String
  brand        String?
  model        String?
  serialNumber String?  @map("serial_number")
  imei         String?
  color        String?
  condition    String?
  accessories  String?
  notes        String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime? @updatedAt @map("updated_at")

  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  customer      Customer       @relation(fields: [customerId], references: [id])
  serviceOrders ServiceOrder[]

  @@index([tenantId, customerId])
  @@map("devices")
}

// ============================================
// SERVICE ORDERS
// ============================================

enum OrderStatus {
  OPEN
  IN_ANALYSIS
  WAITING_APPROVAL
  APPROVED
  IN_PROGRESS
  WAITING_PARTS
  COMPLETED
  DELIVERED
  CANCELLED
}

enum OrderPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model ServiceOrder {
  id                 String        @id @default(uuid())
  tenantId           String        @map("tenant_id")
  customerId         String        @map("customer_id")
  deviceId           String        @map("device_id")
  number             Int
  status             OrderStatus   @default(OPEN)
  priority           OrderPriority @default(NORMAL)
  technicianId       String?       @map("technician_id")
  createdById        String        @map("created_by_id")
  problemDescription String        @map("problem_description")
  diagnosis          String?
  solution           String?
  entryDate          DateTime      @default(now()) @map("entry_date")
  estimatedDate      DateTime?     @map("estimated_date")
  completedDate      DateTime?     @map("completed_date")
  deliveredDate      DateTime?     @map("delivered_date")
  estimatedCost      Decimal?      @map("estimated_cost") @db.Decimal(10, 2)
  finalCost          Decimal?      @map("final_cost") @db.Decimal(10, 2)
  discount           Decimal?      @default(0) @db.Decimal(10, 2)
  internalNotes      String?       @map("internal_notes")
  customerNotes      String?       @map("customer_notes")
  warrantyDays       Int?          @default(90) @map("warranty_days")
  warrantyUntil      DateTime?     @map("warranty_until")
  createdAt          DateTime      @default(now()) @map("created_at")
  updatedAt          DateTime?     @updatedAt @map("updated_at")

  tenant     Tenant     @relation(fields: [tenantId], references: [id])
  customer   Customer   @relation(fields: [customerId], references: [id])
  device     Device     @relation(fields: [deviceId], references: [id])
  technician User?      @relation("AssignedTechnician", fields: [technicianId], references: [id])
  createdBy  User       @relation("CreatedBy", fields: [createdById], references: [id])
  items      ServiceOrderItem[]
  history    ServiceOrderHistory[]

  @@unique([tenantId, number])
  @@index([tenantId, status])
  @@index([tenantId, customerId])
  @@map("service_orders")
}

enum ItemType {
  SERVICE
  PART
  OTHER
}

model ServiceOrderItem {
  id             String   @id @default(uuid())
  serviceOrderId String   @map("service_order_id")
  type           ItemType
  description    String
  quantity       Int      @default(1)
  unitPrice      Decimal  @map("unit_price") @db.Decimal(10, 2)
  totalPrice     Decimal  @map("total_price") @db.Decimal(10, 2)
  createdAt      DateTime @default(now()) @map("created_at")

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)

  @@map("service_order_items")
}

model ServiceOrderHistory {
  id             String   @id @default(uuid())
  serviceOrderId String   @map("service_order_id")
  userId         String?  @map("user_id")
  action         String
  description    String
  oldValue       String?  @map("old_value")
  newValue       String?  @map("new_value")
  createdAt      DateTime @default(now()) @map("created_at")

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])

  @@index([serviceOrderId, createdAt])
  @@map("service_order_history")
}
```

---

## 10. Configuração Multi-Tenant

No seu projeto, o multi-tenant é implementado através do `tenantId` no payload do JWT:

```typescript
// src/infra/auth/jwt.strategy.ts
const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  tenantId: z.string().uuid(),
  role: z.string(),
})

export type UserPayload = z.infer<typeof tokenPayloadSchema>
```

Todos os use cases recebem `tenantId` e filtram os dados por ele. Isso garante isolamento lógico entre tenants.

---

## 11. Próximos Passos

1. **Criar estrutura base** - core, domain, infra
2. **Implementar módulo de auth** - registro de tenant + usuário
3. **Implementar bounded contexts** na ordem:
   - account (tenant, user)
   - customer
   - device
   - service-order
4. **Adicionar testes unitários** com Vitest
5. **Adicionar testes e2e**
6. **Configurar Docker**

---

*Arquitetura baseada no padrão do projeto learn-connect-api.*
