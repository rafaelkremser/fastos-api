import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeServiceOrderItem } from 'test/factories/make-service-order-item'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderItem } from '../../enterprise/entities/service-order-item'
import { ServiceOrderItemList } from '../../enterprise/entities/service-order-item-list'
import { RemoveServiceOrderItemUseCase } from './remove-service-order-item'

let itemsRepository: InMemoryServiceOrderItemsRepository
let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: RemoveServiceOrderItemUseCase

const tenantId = new UniqueEntityID()

function orderWithItems(items: ServiceOrderItem[], orderTenantId = tenantId) {
  const serviceOrder = makeServiceOrder({
    tenantId: orderTenantId,
    items: new ServiceOrderItemList(items),
  })
  serviceOrdersRepository.items.push(serviceOrder)
  itemsRepository.items.push(...items)
  return serviceOrder
}

function request(serviceOrderId: UniqueEntityID, itemId: UniqueEntityID) {
  return {
    tenantId: tenantId.toString(),
    serviceOrderId: serviceOrderId.toString(),
    itemId: itemId.toString(),
  }
}

describe('Remove Service Order Item', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryServiceOrderItemsRepository()
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      itemsRepository,
    )
    sut = new RemoveServiceOrderItemUseCase(serviceOrdersRepository)
  })

  it('should remove the item from the order and delete it', async () => {
    const screen = makeServiceOrderItem({ unitPrice: 200 })
    const battery = makeServiceOrderItem({ unitPrice: 75 })
    const serviceOrder = orderWithItems([screen, battery])

    const result = await sut.execute(request(serviceOrder.id, screen.id))

    expect(result.isRight()).toBe(true)
    expect(serviceOrder.totalItemsCost).toBe(75)
    expect(itemsRepository.items).toEqual([battery])
  })

  it('should not remove an item that belongs to another order', async () => {
    const serviceOrder = orderWithItems([makeServiceOrderItem()])
    const otherItem = makeServiceOrderItem()
    orderWithItems([otherItem])

    const result = await sut.execute(request(serviceOrder.id, otherItem.id))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(itemsRepository.items).toHaveLength(2)
  })

  it('should not remove an item from an order that does not exist', async () => {
    const result = await sut.execute(
      request(new UniqueEntityID(), new UniqueEntityID()),
    )

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not remove an item from an order from another tenant', async () => {
    const item = makeServiceOrderItem()
    const serviceOrder = orderWithItems([item], new UniqueEntityID())

    const result = await sut.execute(request(serviceOrder.id, item.id))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(itemsRepository.items).toHaveLength(1)
  })
})
