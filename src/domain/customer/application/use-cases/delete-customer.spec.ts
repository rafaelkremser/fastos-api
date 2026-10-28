import { InMemoryCustomersRepository } from 'test/repositories/in-memory-customers-repository'
import { InMemoryDevicesRepository } from 'test/repositories/in-memory-devices-repository'
import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeCustomer } from 'test/factories/make-customer'
import { makeDevice } from 'test/factories/make-device'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { DeleteCustomerUseCase } from './delete-customer'
import { CustomerHasServiceOrdersError } from './errors/customer-has-service-orders-error'

let customersRepository: InMemoryCustomersRepository
let devicesRepository: InMemoryDevicesRepository
let serviceOrdersRepository: InMemoryServiceOrdersRepository
let transactionManager: FakeTransactionManager
let sut: DeleteCustomerUseCase

describe('Delete Customer', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository()
    devicesRepository = new InMemoryDevicesRepository()
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    transactionManager = new FakeTransactionManager()
    sut = new DeleteCustomerUseCase(
      customersRepository,
      devicesRepository,
      serviceOrdersRepository,
      transactionManager,
    )
  })

  it('should delete the customer and its devices in one transaction', async () => {
    const customer = makeCustomer()
    const otherDevice = makeDevice({ tenantId: customer.tenantId })
    customersRepository.items.push(customer)
    devicesRepository.items.push(
      makeDevice({ tenantId: customer.tenantId, customerId: customer.id }),
      otherDevice,
    )

    const result = await sut.execute({
      tenantId: customer.tenantId.toString(),
      customerId: customer.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(customersRepository.items).toHaveLength(0)
    expect(devicesRepository.items).toEqual([otherDevice])
    expect(transactionManager.runs).toBe(1)
  })

  it('should keep a customer that has service orders', async () => {
    const customer = makeCustomer()
    customersRepository.items.push(customer)
    devicesRepository.items.push(
      makeDevice({ tenantId: customer.tenantId, customerId: customer.id }),
    )
    serviceOrdersRepository.items.push(
      makeServiceOrder({
        tenantId: customer.tenantId,
        customerId: customer.id,
      }),
    )

    const result = await sut.execute({
      tenantId: customer.tenantId.toString(),
      customerId: customer.id.toString(),
    })

    expect(result.value).toBeInstanceOf(CustomerHasServiceOrdersError)
    expect(customersRepository.items).toHaveLength(1)
    expect(devicesRepository.items).toHaveLength(1)
  })

  it('should not delete a customer from another tenant', async () => {
    const customer = makeCustomer()
    customersRepository.items.push(customer)

    const result = await sut.execute({
      tenantId: 'another-tenant',
      customerId: customer.id.toString(),
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(customersRepository.items).toHaveLength(1)
  })
})
