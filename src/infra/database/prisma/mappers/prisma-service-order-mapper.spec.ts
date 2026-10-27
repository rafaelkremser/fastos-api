import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import {
  PrismaServiceOrderMapper,
  PrismaServiceOrderWithItems,
} from './prisma-service-order-mapper'

function makeRaw(
  items: PrismaServiceOrderWithItems['items'],
): PrismaServiceOrderWithItems {
  return {
    id: randomUUID(),
    tenantId: randomUUID(),
    customerId: randomUUID(),
    deviceId: randomUUID(),
    number: 1,
    status: 'OPEN',
    priority: 'NORMAL',
    technicianId: null,
    createdById: randomUUID(),
    problemDescription: 'Aparelho não liga',
    diagnosis: null,
    solution: null,
    entryDate: new Date(),
    estimatedDate: null,
    completedDate: null,
    deliveredDate: null,
    estimatedCost: null,
    finalCost: null,
    discount: new Prisma.Decimal(20),
    internalNotes: null,
    customerNotes: null,
    warrantyDays: 90,
    warrantyUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items,
  }
}

function makeRawItem(
  serviceOrderId: string,
  quantity: number,
  unitPrice: string,
): PrismaServiceOrderWithItems['items'][number] {
  return {
    id: randomUUID(),
    serviceOrderId,
    type: 'PART',
    description: 'Tela',
    quantity,
    unitPrice: new Prisma.Decimal(unitPrice),
    totalPrice: new Prisma.Decimal(unitPrice).times(quantity),
    createdAt: new Date(),
  }
}

describe('PrismaServiceOrderMapper', () => {
  it('should build the order with the items read from the database', () => {
    const raw = makeRaw([])
    raw.items = [
      makeRawItem(raw.id, 2, '150.50'),
      makeRawItem(raw.id, 1, '80.00'),
    ]

    const serviceOrder = PrismaServiceOrderMapper.toDomain(raw)

    expect(serviceOrder.items.getItems()).toHaveLength(2)
    expect(serviceOrder.totalItemsCost).toBe(381)
    expect(serviceOrder.totalWithDiscount).toBe(361)
  })

  it('should not mark the loaded items as new', () => {
    const raw = makeRaw([])
    raw.items = [makeRawItem(raw.id, 1, '80.00')]

    const serviceOrder = PrismaServiceOrderMapper.toDomain(raw)

    // Otherwise saving the order would insert them again
    expect(serviceOrder.items.getNewItems()).toHaveLength(0)
  })
})
