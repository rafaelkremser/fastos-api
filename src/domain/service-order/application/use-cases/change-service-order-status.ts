import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import {
  ServiceOrder,
  OrderStatus,
} from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'

interface ChangeServiceOrderStatusUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  userId: string
  newStatus: OrderStatus
  notes?: string
}

type ChangeServiceOrderStatusUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class ChangeServiceOrderStatusUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private historyRepository: ServiceOrderHistoryRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    userId,
    newStatus,
    notes,
  }: ChangeServiceOrderStatusUseCaseRequest): Promise<ChangeServiceOrderStatusUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    const oldStatus = serviceOrder.status
    serviceOrder.status = newStatus

    const history = ServiceOrderHistory.create({
      serviceOrderId: new UniqueEntityID(serviceOrderId),
      userId: new UniqueEntityID(userId),
      action: 'STATUS_CHANGED',
      description: notes || `Status alterado de ${oldStatus} para ${newStatus}`,
      oldValue: oldStatus,
      newValue: newStatus,
    })

    await this.transactionManager.run(async () => {
      await this.serviceOrdersRepository.save(serviceOrder)
      await this.historyRepository.create(history)
    })

    return right({ serviceOrder })
  }
}
