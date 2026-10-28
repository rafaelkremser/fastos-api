import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { InMemoryServiceOrderHistoryRepository } from 'test/repositories/in-memory-service-order-history-repository'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { RegisterCustomerNoticeUseCase } from './register-customer-notice'

let serviceOrdersRepository: InMemoryServiceOrdersRepository
let historyRepository: InMemoryServiceOrderHistoryRepository
let transactionManager: FakeTransactionManager
let sut: RegisterCustomerNoticeUseCase

const tenantId = new UniqueEntityID()
const userId = new UniqueEntityID()

describe('Register Customer Notice', () => {
  beforeEach(() => {
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    historyRepository = new InMemoryServiceOrderHistoryRepository()
    transactionManager = new FakeTransactionManager()
    sut = new RegisterCustomerNoticeUseCase(
      serviceOrdersRepository,
      historyRepository,
      transactionManager,
    )
  })

  it('should record the notice on the order and in its history', async () => {
    const serviceOrder = makeServiceOrder({ tenantId, status: 'COMPLETED' })
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: serviceOrder.id.toString(),
      userId: userId.toString(),
      channel: 'WHATSAPP',
      notes: 'Retira amanhã de manhã',
    })

    expect(result.isRight()).toBe(true)
    expect(serviceOrdersRepository.items[0].needsCustomerNotice).toBe(false)
    expect(historyRepository.items[0]).toMatchObject({
      action: 'CUSTOMER_NOTIFIED',
      description: 'Cliente avisado por WhatsApp: Retira amanhã de manhã',
      newValue: 'WHATSAPP',
    })
    expect(transactionManager.runs).toBe(1)
  })

  it('should describe the channel when there is no note', async () => {
    const serviceOrder = makeServiceOrder({ tenantId })
    serviceOrdersRepository.items.push(serviceOrder)

    await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: serviceOrder.id.toString(),
      userId: userId.toString(),
      channel: 'PHONE',
    })

    expect(historyRepository.items[0].description).toBe(
      'Cliente avisado por telefone',
    )
  })

  it('should not touch an order of another tenant', async () => {
    const serviceOrder = makeServiceOrder({ status: 'COMPLETED' })
    serviceOrdersRepository.items.push(serviceOrder)

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      serviceOrderId: serviceOrder.id.toString(),
      userId: userId.toString(),
      channel: 'WHATSAPP',
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(serviceOrdersRepository.items[0].needsCustomerNotice).toBe(true)
    expect(historyRepository.items).toHaveLength(0)
  })
})
