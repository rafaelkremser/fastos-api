import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryServiceOrderHistoryRepository } from 'test/repositories/in-memory-service-order-history-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'
import { GetStageTimesUseCase } from './get-stage-times'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let historyRepository: InMemoryServiceOrderHistoryRepository
let sut: GetStageTimesUseCase

const tenantId = new UniqueEntityID('tenant-1')
const now = new Date('2026-10-30T15:00:00Z')

// An order that came in then and went through the statuses at those times
function addOrder(
  entryDate: string,
  steps: [string, string, string][],
  orderTenantId = tenantId,
) {
  const order = makeServiceOrder({
    tenantId: orderTenantId,
    entryDate: new Date(entryDate),
  })
  serviceOrdersRepository.items.push(order)

  for (const [from, to, at] of steps) {
    historyRepository.items.push(
      ServiceOrderHistory.create({
        serviceOrderId: order.id,
        userId: null,
        action: 'STATUS_CHANGED',
        description: `${from} -> ${to}`,
        oldValue: from,
        newValue: to,
        createdAt: new Date(at),
      }),
    )
  }
}

describe('Get Stage Times', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    historyRepository = new InMemoryServiceOrderHistoryRepository(
      serviceOrdersRepository,
    )
    sut = new GetStageTimesUseCase(historyRepository)
  })

  it('should give the median time orders spend in each stage', async () => {
    addOrder('2026-10-01T10:00:00Z', [
      ['OPEN', 'IN_ANALYSIS', '2026-10-01T12:00:00Z'], // 2 h
      ['IN_ANALYSIS', 'WAITING_PARTS', '2026-10-02T12:00:00Z'], // 24 h
      ['WAITING_PARTS', 'IN_PROGRESS', '2026-10-05T12:00:00Z'], // 72 h
      ['IN_PROGRESS', 'COMPLETED', '2026-10-05T16:00:00Z'], // 4 h
      ['COMPLETED', 'DELIVERED', '2026-10-06T16:00:00Z'], // 24 h
    ])
    addOrder('2026-10-10T10:00:00Z', [
      ['OPEN', 'IN_ANALYSIS', '2026-10-10T16:00:00Z'], // 6 h
      ['IN_ANALYSIS', 'IN_PROGRESS', '2026-10-10T18:30:00Z'], // 2.5 h
    ])
    addOrder('2026-10-20T10:00:00Z', [
      ['OPEN', 'IN_ANALYSIS', '2026-10-20T11:00:00Z'], // 1 h
    ])
    // Another store's
    addOrder(
      '2026-10-01T10:00:00Z',
      [['OPEN', 'IN_ANALYSIS', '2026-10-09T10:00:00Z']],
      new UniqueEntityID(),
    )

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.stages).toEqual([
      { status: 'OPEN', stays: 3, medianHours: 2 },
      // 24 and 2.5
      { status: 'IN_ANALYSIS', stays: 2, medianHours: 13.3 },
      { status: 'WAITING_APPROVAL', stays: 0, medianHours: null },
      { status: 'APPROVED', stays: 0, medianHours: null },
      { status: 'IN_PROGRESS', stays: 1, medianHours: 4 },
      { status: 'WAITING_PARTS', stays: 1, medianHours: 72 },
      { status: 'COMPLETED', stays: 1, medianHours: 24 },
    ])
  })

  it('should take stays that ended in the last 90 days, from when they began', async () => {
    // Waited for parts from June to August 15: ended inside the 90 days
    addOrder('2026-06-01T10:00:00Z', [
      ['OPEN', 'WAITING_PARTS', '2026-06-01T12:00:00Z'],
      ['WAITING_PARTS', 'IN_PROGRESS', '2026-08-15T12:00:00Z'],
    ])
    // Everything before August 1
    addOrder('2026-05-01T10:00:00Z', [
      ['OPEN', 'IN_PROGRESS', '2026-05-02T10:00:00Z'],
    ])

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    const stage = (status: string) =>
      result.value.stages.find((item) => item.status === status)
    // June 1 to August 15: 75 days
    expect(stage('WAITING_PARTS')).toEqual({
      status: 'WAITING_PARTS',
      stays: 1,
      medianHours: 75 * 24,
    })
    // The June stay in "OPEN" ended before the period
    expect(stage('OPEN')).toEqual({
      status: 'OPEN',
      stays: 0,
      medianHours: null,
    })
  })
})
