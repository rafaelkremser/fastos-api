import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'

interface FetchServiceOrderHistoryUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  page: number
  perPage?: number
}

type FetchServiceOrderHistoryUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { history: ServiceOrderHistory[] }
>

@Injectable()
export class FetchServiceOrderHistoryUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private historyRepository: ServiceOrderHistoryRepository,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    page,
    perPage,
  }: FetchServiceOrderHistoryUseCaseRequest): Promise<FetchServiceOrderHistoryUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    const history = await this.historyRepository.findManyByServiceOrderId(
      serviceOrderId,
      { page, perPage },
    )

    return right({ history })
  }
}
