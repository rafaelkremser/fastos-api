import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeServiceOrderItem } from 'test/factories/make-service-order-item'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderProps } from '../../enterprise/entities/service-order'
import {
  DAILY_REVENUE_DAYS,
  GetRevenueMetricsUseCase,
} from './get-revenue-metrics'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: GetRevenueMetricsUseCase

const tenantId = new UniqueEntityID('tenant-1')

// A delivered order of the tenant
function deliver(deliveredDate: string, override: Partial<ServiceOrderProps>) {
  const order = makeServiceOrder({
    tenantId,
    status: 'DELIVERED',
    deliveredDate: new Date(deliveredDate),
    ...override,
  })
  serviceOrdersRepository.items.push(order)

  return order
}

// October 10 at noon in Brazil
const now = new Date('2026-10-10T15:00:00Z')

describe('Get Revenue Metrics', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    sut = new GetRevenueMetricsUseCase(serviceOrdersRepository)
  })

  it('should add up the orders delivered this month, by the order total', async () => {
    // Final cost wins over the quote
    deliver('2026-10-02T15:00:00Z', {
      finalCost: 300,
      estimatedCost: 250,
      discount: 20,
    })
    deliver('2026-10-05T15:00:00Z', { estimatedCost: 150.5 })
    // Without values, the items count
    const byItems = deliver('2026-10-06T15:00:00Z', {})
    byItems.addItem(
      makeServiceOrderItem({ serviceOrderId: byItems.id, unitPrice: 89.9 }),
    )
    byItems.addItem(
      makeServiceOrderItem({
        serviceOrderId: byItems.id,
        unitPrice: 35.5,
        quantity: 2,
      }),
    )
    // Delivered on September 30 at 22:00 in Brazil, already October in UTC
    deliver('2026-10-01T01:00:00Z', { finalCost: 999 })
    // Ready, not delivered
    serviceOrdersRepository.items.push(
      makeServiceOrder({ tenantId, status: 'COMPLETED', finalCost: 500 }),
    )
    // Another store's
    serviceOrdersRepository.items.push(
      makeServiceOrder({
        status: 'DELIVERED',
        deliveredDate: new Date('2026-10-03T15:00:00Z'),
        finalCost: 700,
      }),
    )

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.metrics.currentMonth).toEqual({
      delivered: 3,
      // 280 + 150.50 + 160.90
      revenue: 591.4,
    })
  })

  it('should compare with the same stretch of the previous month', async () => {
    deliver('2026-09-04T15:00:00Z', { finalCost: 100 })
    // September 10 at 11:00 and at 15:00 in Brazil; now is October 10 at noon
    deliver('2026-09-10T14:00:00Z', { finalCost: 50 })
    deliver('2026-09-10T18:00:00Z', { finalCost: 999 })
    deliver('2026-09-30T15:00:00Z', { finalCost: 999 })

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight() && result.value.metrics.previousMonth).toEqual({
      delivered: 2,
      revenue: 150,
    })
  })

  it('should not reach past the end of a shorter previous month', async () => {
    deliver('2026-02-27T15:00:00Z', { finalCost: 100 })
    deliver('2026-03-01T15:00:00Z', { finalCost: 999 })

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      now: new Date('2026-03-31T15:00:00Z'),
    })

    expect(result.isRight() && result.value.metrics.previousMonth).toEqual({
      delivered: 1,
      revenue: 100,
    })
  })

  it('should give every one of the last days, by the day in Brazil', async () => {
    deliver('2026-10-09T15:00:00Z', { finalCost: 100 })
    // October 9 at 23:00 in Brazil
    deliver('2026-10-10T02:00:00Z', { finalCost: 50 })
    deliver('2026-10-10T13:00:00Z', { finalCost: 80 })
    // September 10: one day before the series begins
    deliver('2026-09-10T15:00:00Z', { finalCost: 999 })

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    const { daily } = result.value.metrics
    expect(daily).toHaveLength(DAILY_REVENUE_DAYS)
    expect(daily[0]).toEqual({ day: '2026-09-11', delivered: 0, revenue: 0 })
    expect(daily[DAILY_REVENUE_DAYS - 2]).toEqual({
      day: '2026-10-09',
      delivered: 2,
      revenue: 150,
    })
    expect(daily[DAILY_REVENUE_DAYS - 1]).toEqual({
      day: '2026-10-10',
      delivered: 1,
      revenue: 80,
    })
  })
})
