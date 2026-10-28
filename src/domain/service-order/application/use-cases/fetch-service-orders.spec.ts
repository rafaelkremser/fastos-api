import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchServiceOrdersUseCase } from './fetch-service-orders'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: FetchServiceOrdersUseCase

describe('Fetch Service Orders', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    sut = new FetchServiceOrdersUseCase(serviceOrdersRepository)
  })

  it('should count every order of the tenant, not only the page', async () => {
    const tenantId = new UniqueEntityID()
    for (let i = 0; i < 21; i++) {
      serviceOrdersRepository.items.push(makeServiceOrder({ tenantId }))
    }
    serviceOrdersRepository.items.push(makeServiceOrder())

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 2,
    })

    expect(result.value?.serviceOrders).toHaveLength(1)
    expect(result.value?.totalCount).toBe(21)
  })

  it('should count with the same filters as the list', async () => {
    const tenantId = new UniqueEntityID()
    serviceOrdersRepository.items.push(
      makeServiceOrder({ tenantId, status: 'OPEN' }),
      makeServiceOrder({ tenantId, status: 'OPEN' }),
      makeServiceOrder({ tenantId, status: 'DELIVERED' }),
    )

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      status: 'OPEN',
    })

    expect(result.value?.serviceOrders).toHaveLength(2)
    expect(result.value?.totalCount).toBe(2)
  })
})
