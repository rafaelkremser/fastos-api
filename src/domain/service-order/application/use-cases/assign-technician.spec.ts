import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryServiceOrderHistoryRepository } from 'test/repositories/in-memory-service-order-history-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { AssignTechnicianUseCase } from './assign-technician'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let usersRepository: InMemoryUsersRepository
let historyRepository: InMemoryServiceOrderHistoryRepository
let transactionManager: FakeTransactionManager
let sut: AssignTechnicianUseCase

const tenantId = new UniqueEntityID()
const managerId = new UniqueEntityID()

function request(serviceOrderId: UniqueEntityID, technicianId: UniqueEntityID) {
  return {
    tenantId: tenantId.toString(),
    serviceOrderId: serviceOrderId.toString(),
    technicianId: technicianId.toString(),
    assignedById: managerId.toString(),
  }
}

describe('Assign Technician', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    usersRepository = new InMemoryUsersRepository()
    historyRepository = new InMemoryServiceOrderHistoryRepository()
    transactionManager = new FakeTransactionManager()
    sut = new AssignTechnicianUseCase(
      serviceOrdersRepository,
      usersRepository,
      historyRepository,
      transactionManager,
    )
  })

  it('should assign the technician and record it in the history', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    const technician = makeUser({ tenantId, role: 'TECHNICIAN' })
    serviceOrdersRepository.items.push(serviceOrder)
    usersRepository.items.push(technician)

    const result = await sut.execute(request(serviceOrder.id, technician.id))

    expect(result.isRight()).toBe(true)
    expect(serviceOrdersRepository.items[0].technicianId).toEqual(technician.id)
    expect(historyRepository.items[0]).toMatchObject({
      action: 'TECHNICIAN_ASSIGNED',
      oldValue: null,
      newValue: technician.id.toString(),
    })
  })

  it('should save the order and its history in a single transaction', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    const technician = makeUser({ tenantId, role: 'TECHNICIAN' })
    serviceOrdersRepository.items.push(serviceOrder)
    usersRepository.items.push(technician)
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

    await sut.execute(request(serviceOrder.id, technician.id))

    expect(transactionManager.runs).toBe(1)
    expect(writes).toEqual([
      'order, in transaction: true',
      'history, in transaction: true',
    ])
  })

  it('should not assign a user from another tenant', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    const outsider = makeUser({ role: 'TECHNICIAN' })
    serviceOrdersRepository.items.push(serviceOrder)
    usersRepository.items.push(outsider)

    const result = await sut.execute(request(serviceOrder.id, outsider.id))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(transactionManager.runs).toBe(0)
  })
})
