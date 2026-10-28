import { InMemoryCustomersRepository } from 'test/repositories/in-memory-customers-repository'
import { makeCustomer } from 'test/factories/make-customer'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchCustomersUseCase } from './fetch-customers'

let customersRepository: InMemoryCustomersRepository
let sut: FetchCustomersUseCase

describe('Fetch Customers', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository()
    sut = new FetchCustomersUseCase(customersRepository)
  })

  it('should count every customer of the tenant, not only the page', async () => {
    const tenantId = new UniqueEntityID()
    for (let i = 0; i < 25; i++) {
      customersRepository.items.push(makeCustomer({ tenantId }))
    }
    customersRepository.items.push(makeCustomer())

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 2,
    })

    expect(result.value?.customers).toHaveLength(5)
    expect(result.value?.totalCount).toBe(25)
  })

  it('should count only the customers the search finds', async () => {
    const tenantId = new UniqueEntityID()
    customersRepository.items.push(
      makeCustomer({ tenantId, name: 'Maria Souza' }),
      makeCustomer({ tenantId, name: 'Mariana Lima' }),
      makeCustomer({ tenantId, name: 'João Silva' }),
      makeCustomer({ name: 'Maria de outra loja' }),
    )

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      search: 'mari',
    })

    expect(result.value?.customers).toHaveLength(2)
    expect(result.value?.totalCount).toBe(2)
  })
})
