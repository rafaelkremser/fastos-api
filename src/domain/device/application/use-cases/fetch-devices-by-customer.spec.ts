import { InMemoryDevicesRepository } from 'test/repositories/in-memory-devices-repository'
import { makeDevice } from 'test/factories/make-device'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchDevicesByCustomerUseCase } from './fetch-devices-by-customer'

let devicesRepository: InMemoryDevicesRepository
let sut: FetchDevicesByCustomerUseCase

describe('Fetch Devices By Customer', () => {
  beforeEach(() => {
    devicesRepository = new InMemoryDevicesRepository()
    sut = new FetchDevicesByCustomerUseCase(devicesRepository)
  })

  it('should count every device of the customer, not only the page', async () => {
    const tenantId = new UniqueEntityID()
    const customerId = new UniqueEntityID()
    for (let i = 0; i < 22; i++) {
      devicesRepository.items.push(makeDevice({ tenantId, customerId }))
    }
    devicesRepository.items.push(
      makeDevice({ tenantId }),
      makeDevice({ customerId }),
    )

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      customerId: customerId.toString(),
      page: 2,
    })

    expect(result.value?.devices).toHaveLength(2)
    expect(result.value?.totalCount).toBe(22)
  })
})
