import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { EditServiceOrderUseCase } from './edit-service-order'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: EditServiceOrderUseCase

const tenantId = new UniqueEntityID()

describe('Edit Service Order', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    sut = new EditServiceOrderUseCase(serviceOrdersRepository)
  })

  it('should edit the order and keep its technician', async () => {
    const technicianId = new UniqueEntityID()
    const serviceOrder = makeServiceOrder({ tenantId, technicianId })
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: serviceOrder.id.toString(),
      diagnosis: 'Tela trincada',
      finalCost: 350,
    })

    expect(result.isRight()).toBe(true)
    expect(serviceOrdersRepository.items[0]).toMatchObject({
      diagnosis: 'Tela trincada',
      finalCost: 350,
    })
    expect(serviceOrdersRepository.items[0].technicianId).toEqual(technicianId)
  })

  it('should not edit an order from another store', async () => {
    const serviceOrder = makeServiceOrder()
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: serviceOrder.id.toString(),
      diagnosis: 'Tela trincada',
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(serviceOrdersRepository.items[0].diagnosis).toBeNull()
  })

  it('should say when the order does not exist', async () => {
    const result = await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: new UniqueEntityID().toString(),
      diagnosis: 'Tela trincada',
    })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
