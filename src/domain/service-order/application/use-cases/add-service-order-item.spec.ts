import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeServiceOrderItem } from 'test/factories/make-service-order-item'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderItemList } from '../../enterprise/entities/service-order-item-list'
import { AddServiceOrderItemUseCase } from './add-service-order-item'

let itemsRepository: InMemoryServiceOrderItemsRepository
let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: AddServiceOrderItemUseCase

const tenantId = new UniqueEntityID()

function request(serviceOrderId: UniqueEntityID) {
  return {
    tenantId: tenantId.toString(),
    serviceOrderId: serviceOrderId.toString(),
    type: 'PART' as const,
    description: 'Bateria',
    quantity: 2,
    unitPrice: 75,
  }
}

describe('Add Service Order Item', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryServiceOrderItemsRepository()
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      itemsRepository,
    )
    sut = new AddServiceOrderItemUseCase(serviceOrdersRepository)
  })

  it('should add the item to the order and save it', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute(request(serviceOrder.id))

    expect(result.isRight()).toBe(true)
    expect(serviceOrder.items.getItems()).toHaveLength(1)
    expect(serviceOrder.totalItemsCost).toBe(150)
    expect(itemsRepository.items).toHaveLength(1)
    expect(itemsRepository.items[0].serviceOrderId).toEqual(serviceOrder.id)
  })

  it('should keep the existing items without saving them again', async () => {
    const existing = makeServiceOrderItem({ unitPrice: 100 })
    const serviceOrder = makeServiceOrder({
      tenantId,
      items: new ServiceOrderItemList([existing]),
    })
    serviceOrdersRepository.items.push(serviceOrder)
    itemsRepository.items.push(existing)

    await sut.execute(request(serviceOrder.id))

    expect(serviceOrder.totalItemsCost).toBe(250)
    expect(itemsRepository.items).toHaveLength(2)
  })

  it('should not add an item to an order that does not exist', async () => {
    const result = await sut.execute(request(new UniqueEntityID()))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not add an item to an order from another tenant', async () => {
    const serviceOrder = makeServiceOrder()
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute(request(serviceOrder.id))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(itemsRepository.items).toHaveLength(0)
  })
})
