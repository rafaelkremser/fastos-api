import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderProps } from '../../enterprise/entities/service-order'
import { GetOperationsMetricsUseCase } from './get-operations-metrics'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: GetOperationsMetricsUseCase

const tenantId = new UniqueEntityID('tenant-1')

function addOrder(override: Partial<ServiceOrderProps> = {}) {
  serviceOrdersRepository.items.push(
    makeServiceOrder({ tenantId, ...override }),
  )
}

// 2026-10-30 at 01:00 in Brazil, still 04:00 on the same day in UTC
const now = new Date('2026-10-30T04:00:00Z')

describe('Get Operations Metrics', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    sut = new GetOperationsMetricsUseCase(serviceOrdersRepository)
  })

  it('should count the orders of each status, the empty ones with zero', async () => {
    addOrder({ status: 'OPEN' })
    addOrder({ status: 'OPEN' })
    addOrder({ status: 'WAITING_PARTS' })
    addOrder({ status: 'COMPLETED' })
    addOrder({ status: 'DELIVERED' })
    addOrder({ status: 'CANCELLED' })
    // Another store's
    serviceOrdersRepository.items.push(makeServiceOrder({ status: 'OPEN' }))

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.metrics.byStatus).toEqual({
      OPEN: 2,
      IN_ANALYSIS: 0,
      WAITING_APPROVAL: 0,
      APPROVED: 0,
      IN_PROGRESS: 0,
      WAITING_PARTS: 1,
      COMPLETED: 1,
      DELIVERED: 1,
      CANCELLED: 1,
    })
    expect(result.value.metrics.active).toBe(3)
    expect(result.value.metrics.readyForPickup).toBe(1)
  })

  it('should count as late only active orders due before today in Brazil', async () => {
    const day = (date: string) => new Date(`${date}T00:00:00.000Z`)

    addOrder({ status: 'IN_PROGRESS', estimatedDate: day('2026-10-29') })
    addOrder({ status: 'OPEN', estimatedDate: day('2026-10-01') })
    // Due today: not late yet
    addOrder({ status: 'IN_PROGRESS', estimatedDate: day('2026-10-30') })
    addOrder({ status: 'IN_PROGRESS', estimatedDate: null })
    // Done, even if after the due day
    addOrder({ status: 'COMPLETED', estimatedDate: day('2026-10-20') })
    addOrder({ status: 'CANCELLED', estimatedDate: day('2026-10-20') })

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      // 2026-10-30 at 23:30 in Brazil, already the 31st in UTC
      now: new Date('2026-10-31T02:30:00Z'),
    })

    expect(result.isRight() && result.value.metrics.late).toBe(2)
  })

  it('should count the orders whose customer still needs a notice', async () => {
    addOrder({ status: 'COMPLETED' })
    addOrder({ status: 'WAITING_APPROVAL' })
    addOrder({ status: 'COMPLETED', customerNotifiedAt: new Date() })
    addOrder({ status: 'IN_PROGRESS' })

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight() && result.value.metrics.needsCustomerNotice).toBe(2)
  })
})
