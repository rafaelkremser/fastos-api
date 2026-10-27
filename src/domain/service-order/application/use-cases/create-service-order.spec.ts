import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryCustomersRepository } from 'test/repositories/in-memory-customers-repository'
import { InMemoryDevicesRepository } from 'test/repositories/in-memory-devices-repository'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeCustomer } from 'test/factories/make-customer'
import { makeDevice } from 'test/factories/make-device'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CreateServiceOrderUseCase } from './create-service-order'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let customersRepository: InMemoryCustomersRepository
let devicesRepository: InMemoryDevicesRepository
let transactionManager: FakeTransactionManager
let sut: CreateServiceOrderUseCase

// Registers a customer and a device in the tenant and returns a request for them
function requestFor(tenantId: UniqueEntityID) {
  const customer = makeCustomer({ tenantId })
  const device = makeDevice({ tenantId, customerId: customer.id })
  customersRepository.items.push(customer)
  devicesRepository.items.push(device)

  return {
    tenantId: tenantId.toString(),
    customerId: customer.id.toString(),
    deviceId: device.id.toString(),
    createdById: new UniqueEntityID().toString(),
    problemDescription: 'Aparelho não liga',
  }
}

describe('Create Service Order', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    customersRepository = new InMemoryCustomersRepository()
    devicesRepository = new InMemoryDevicesRepository()
    transactionManager = new FakeTransactionManager()
    sut = new CreateServiceOrderUseCase(
      serviceOrdersRepository,
      customersRepository,
      devicesRepository,
      transactionManager,
    )
  })

  it('should give each order of a tenant the next number', async () => {
    const tenantId = new UniqueEntityID()

    const first = await sut.execute(requestFor(tenantId))
    const second = await sut.execute(requestFor(tenantId))

    expect(first.isRight() && first.value.serviceOrder.number).toBe(1)
    expect(second.isRight() && second.value.serviceOrder.number).toBe(2)
    expect(serviceOrdersRepository.items).toHaveLength(2)
  })

  it('should number each tenant on its own', async () => {
    await sut.execute(requestFor(new UniqueEntityID()))

    const result = await sut.execute(requestFor(new UniqueEntityID()))

    expect(result.isRight() && result.value.serviceOrder.number).toBe(1)
  })

  it('should reserve the number and create the order in a single transaction', async () => {
    const steps: string[] = []
    const reserve = serviceOrdersRepository.reserveNextNumber.bind(
      serviceOrdersRepository,
    )
    const create = serviceOrdersRepository.create.bind(serviceOrdersRepository)
    jest
      .spyOn(serviceOrdersRepository, 'reserveNextNumber')
      .mockImplementation(async (tenantId) => {
        steps.push(`number, in transaction: ${transactionManager.isRunning}`)
        return reserve(tenantId)
      })
    jest
      .spyOn(serviceOrdersRepository, 'create')
      .mockImplementation(async (order) => {
        steps.push(`order, in transaction: ${transactionManager.isRunning}`)
        return create(order)
      })

    await sut.execute(requestFor(new UniqueEntityID()))

    expect(transactionManager.runs).toBe(1)
    expect(steps).toEqual([
      'number, in transaction: true',
      'order, in transaction: true',
    ])
  })

  it('should not take a number for a customer from another tenant', async () => {
    const request = requestFor(new UniqueEntityID())
    const tenantId = new UniqueEntityID().toString()

    const result = await sut.execute({ ...request, tenantId })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(serviceOrdersRepository.lastNumbers.size).toBe(0)
    expect(transactionManager.runs).toBe(0)
  })

  it('should not take a number for a device from another tenant', async () => {
    const tenantId = new UniqueEntityID()
    const request = requestFor(tenantId)
    const otherDevice = makeDevice()
    devicesRepository.items.push(otherDevice)

    const result = await sut.execute({
      ...request,
      deviceId: otherDevice.id.toString(),
    })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(serviceOrdersRepository.lastNumbers.size).toBe(0)
    expect(serviceOrdersRepository.items).toHaveLength(0)
  })
})
