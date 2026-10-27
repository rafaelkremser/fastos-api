import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryServiceOrderHistoryRepository } from 'test/repositories/in-memory-service-order-history-repository'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ChangeServiceOrderStatusUseCase } from './change-service-order-status'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let historyRepository: InMemoryServiceOrderHistoryRepository
let transactionManager: FakeTransactionManager
let sut: ChangeServiceOrderStatusUseCase

const tenantId = new UniqueEntityID()
const userId = new UniqueEntityID()

function request(serviceOrderId: UniqueEntityID) {
  return {
    tenantId: tenantId.toString(),
    serviceOrderId: serviceOrderId.toString(),
    userId: userId.toString(),
    newStatus: 'IN_ANALYSIS' as const,
  }
}

describe('Change Service Order Status', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    historyRepository = new InMemoryServiceOrderHistoryRepository()
    transactionManager = new FakeTransactionManager()
    sut = new ChangeServiceOrderStatusUseCase(
      serviceOrdersRepository,
      historyRepository,
      transactionManager,
    )
  })

  it('should change the status and record it in the history', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute(request(serviceOrder.id))

    expect(result.isRight()).toBe(true)
    expect(serviceOrdersRepository.items[0].status).toBe('IN_ANALYSIS')
    expect(historyRepository.items[0]).toMatchObject({
      action: 'STATUS_CHANGED',
      oldValue: 'OPEN',
      newValue: 'IN_ANALYSIS',
    })
  })

  it('should save the order and its history in a single transaction', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    serviceOrdersRepository.items.push(serviceOrder)
    const writes: string[] = []
    const save = serviceOrdersRepository.save.bind(serviceOrdersRepository)
    const create = historyRepository.create.bind(historyRepository)
    jest
      .spyOn(serviceOrdersRepository, 'save')
      .mockImplementation(async (order) => {
        writes.push(`order, in transaction: ${transactionManager.isRunning}`)
        return save(order)
      })
    jest
      .spyOn(historyRepository, 'create')
      .mockImplementation(async (entry) => {
        writes.push(`history, in transaction: ${transactionManager.isRunning}`)
        return create(entry)
      })

    await sut.execute(request(serviceOrder.id))

    expect(transactionManager.runs).toBe(1)
    expect(writes).toEqual([
      'order, in transaction: true',
      'history, in transaction: true',
    ])
  })

  it('should not change an order from another tenant', async () => {
    const serviceOrder = makeServiceOrder()
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute(request(serviceOrder.id))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(transactionManager.runs).toBe(0)
    expect(historyRepository.items).toHaveLength(0)
  })

  it('should not change an order that does not exist', async () => {
    const result = await sut.execute(request(new UniqueEntityID()))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
