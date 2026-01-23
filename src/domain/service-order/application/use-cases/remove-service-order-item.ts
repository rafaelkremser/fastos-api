import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '../repositories/service-order-items-repository'

interface RemoveServiceOrderItemUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  itemId: string
}

type RemoveServiceOrderItemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class RemoveServiceOrderItemUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private serviceOrderItemsRepository: ServiceOrderItemsRepository,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    itemId,
  }: RemoveServiceOrderItemUseCaseRequest): Promise<RemoveServiceOrderItemUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    const item = await this.serviceOrderItemsRepository.findById(itemId)

    if (!item) {
      return left(new ResourceNotFoundError())
    }

    if (item.serviceOrderId.toString() !== serviceOrderId) {
      return left(new NotAllowedError())
    }

    await this.serviceOrderItemsRepository.delete(item)

    return right(null)
  }
}
