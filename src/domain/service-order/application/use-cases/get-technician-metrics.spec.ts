import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderProps } from '../../enterprise/entities/service-order'
import { GetTechnicianMetricsUseCase } from './get-technician-metrics'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let usersRepository: InMemoryUsersRepository
let sut: GetTechnicianMetricsUseCase

const tenantId = new UniqueEntityID('tenant-1')

// October 10 at noon in Brazil
const now = new Date('2026-10-10T15:00:00Z')
const day = (date: string) => new Date(`${date}T00:00:00.000Z`)

function addOrder(override: Partial<ServiceOrderProps> = {}) {
  serviceOrdersRepository.items.push(
    makeServiceOrder({ tenantId, ...override }),
  )
}

describe('Get Technician Metrics', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    usersRepository = new InMemoryUsersRepository()
    sut = new GetTechnicianMetricsUseCase(
      serviceOrdersRepository,
      usersRepository,
    )
  })

  it("should count each technician's orders now and this month", async () => {
    const carlos = makeUser({ tenantId, name: 'Carlos', role: 'TECHNICIAN' })
    usersRepository.items.push(carlos)
    const technicianId = carlos.id

    addOrder({
      technicianId,
      status: 'IN_PROGRESS',
      estimatedDate: day('2026-10-09'),
    })
    addOrder({ technicianId, status: 'OPEN', estimatedDate: day('2026-10-10') })
    addOrder({
      technicianId,
      status: 'COMPLETED',
      completedDate: new Date('2026-10-05T15:00:00Z'),
    })
    // Completed and delivered this month: counts in both
    addOrder({
      technicianId,
      status: 'DELIVERED',
      completedDate: new Date('2026-10-02T15:00:00Z'),
      deliveredDate: new Date('2026-10-03T15:00:00Z'),
      finalCost: 300,
      discount: 20.1,
    })
    // Completed and delivered in September
    addOrder({
      technicianId,
      status: 'DELIVERED',
      completedDate: new Date('2026-09-20T15:00:00Z'),
      deliveredDate: new Date('2026-09-21T15:00:00Z'),
      finalCost: 999,
    })

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.metrics.technicians).toEqual([
      {
        technicianId: technicianId.toString(),
        name: 'Carlos',
        active: 2,
        late: 1,
        completed: 2,
        delivered: 1,
        revenue: 279.9,
      },
    ])
  })

  it('should list who takes orders even without any, and not the others', async () => {
    usersRepository.items.push(
      makeUser({ tenantId, name: 'Bia', role: 'TECHNICIAN' }),
      makeUser({ tenantId, name: 'Ana', role: 'RECEPTIONIST' }),
      // The owner can take orders in a small store
      makeUser({ tenantId, name: 'Dona', role: 'OWNER' }),
      makeUser({ tenantId, name: 'Ex', role: 'TECHNICIAN', isActive: false }),
    )
    const former = makeUser({
      tenantId,
      name: 'Ex com OS',
      role: 'TECHNICIAN',
      isActive: false,
    })
    usersRepository.items.push(former)
    addOrder({ technicianId: former.id, status: 'OPEN' })

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(
      result.isRight() &&
        result.value.metrics.technicians.map((technician) => technician.name),
    ).toEqual(['Bia', 'Dona', 'Ex com OS'])
  })

  it('should count the unassigned orders apart, and only the tenant ones', async () => {
    addOrder({ status: 'OPEN' })
    addOrder({ status: 'WAITING_PARTS' })
    serviceOrdersRepository.items.push(makeServiceOrder({ status: 'OPEN' }))

    const result = await sut.execute({ tenantId: tenantId.toString(), now })

    expect(result.isRight() && result.value.metrics.unassigned).toEqual({
      active: 2,
      late: 0,
      completed: 0,
      delivered: 0,
      revenue: 0,
    })
  })
})
