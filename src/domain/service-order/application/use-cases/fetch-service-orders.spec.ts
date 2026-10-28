import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryCustomersRepository } from 'test/repositories/in-memory-customers-repository'
import { InMemoryDevicesRepository } from 'test/repositories/in-memory-devices-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeCustomer } from 'test/factories/make-customer'
import { makeDevice } from 'test/factories/make-device'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ServiceOrderProps } from '../../enterprise/entities/service-order'
import { FetchServiceOrdersUseCase } from './fetch-service-orders'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let customersRepository: InMemoryCustomersRepository
let devicesRepository: InMemoryDevicesRepository
let usersRepository: InMemoryUsersRepository
let sut: FetchServiceOrdersUseCase

// An order of the tenant, with its customer and device registered
function addOrder(
  tenantId: UniqueEntityID,
  override: Partial<ServiceOrderProps> = {},
) {
  const customer = makeCustomer({ tenantId })
  const device = makeDevice({ tenantId, customerId: customer.id })
  const order = makeServiceOrder({
    tenantId,
    customerId: customer.id,
    deviceId: device.id,
    ...override,
  })

  customersRepository.items.push(customer)
  devicesRepository.items.push(device)
  serviceOrdersRepository.items.push(order)

  return { customer, device, order }
}

describe('Fetch Service Orders', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository()
    devicesRepository = new InMemoryDevicesRepository()
    usersRepository = new InMemoryUsersRepository()
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
      customersRepository,
      devicesRepository,
      usersRepository,
    )
    sut = new FetchServiceOrdersUseCase(serviceOrdersRepository)
  })

  it('should count every order of the tenant, not only the page', async () => {
    const tenantId = new UniqueEntityID()
    for (let i = 0; i < 21; i++) {
      addOrder(tenantId)
    }
    addOrder(new UniqueEntityID())

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 2,
    })

    expect(result.value?.serviceOrders).toHaveLength(1)
    expect(result.value?.totalCount).toBe(21)
  })

  it('should count with the same filters as the list', async () => {
    const tenantId = new UniqueEntityID()
    addOrder(tenantId, { status: 'OPEN' })
    addOrder(tenantId, { status: 'OPEN' })
    addOrder(tenantId, { status: 'DELIVERED' })

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      status: 'OPEN',
    })

    expect(result.value?.serviceOrders).toHaveLength(2)
    expect(result.value?.totalCount).toBe(2)
  })

  it('should bring the names of the customer, the device and the technician', async () => {
    const tenantId = new UniqueEntityID()
    const technician = makeUser({ tenantId, name: 'Carlos Técnico' })
    usersRepository.items.push(technician)
    const { customer, device } = addOrder(tenantId, {
      technicianId: technician.id,
    })

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
    })

    expect(result.value?.serviceOrders[0]).toMatchObject({
      customerName: customer.name,
      customerPhone: customer.phone,
      deviceType: device.type,
      technicianName: 'Carlos Técnico',
    })
  })

  it('should list the orders whose customer still has to be told', async () => {
    const tenantId = new UniqueEntityID()
    addOrder(tenantId, { number: 1, status: 'COMPLETED' })
    addOrder(tenantId, { number: 2, status: 'WAITING_APPROVAL' })
    addOrder(tenantId, { number: 3, status: 'IN_PROGRESS' })
    const { order: told } = addOrder(tenantId, {
      number: 4,
      status: 'COMPLETED',
    })
    told.registerCustomerNotice()

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      needsCustomerNotice: true,
    })

    expect(
      result.value?.serviceOrders.map((order) => order.number).sort(),
    ).toEqual([1, 2])
    expect(result.value?.serviceOrders[0].needsCustomerNotice).toBe(true)
    expect(result.value?.totalCount).toBe(2)
  })

  it('should find an order by its number', async () => {
    const tenantId = new UniqueEntityID()
    addOrder(tenantId, { number: 41 })
    addOrder(tenantId, { number: 42 })

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      number: 42,
    })

    expect(result.value?.serviceOrders.map((order) => order.number)).toEqual([
      42,
    ])
    expect(result.value?.totalCount).toBe(1)
  })
})
