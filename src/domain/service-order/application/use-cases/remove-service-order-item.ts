import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'

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
  constructor(private serviceOrdersRepository: ServiceOrdersRepository) {}

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

    // An item of another order is simply not among this order's items
    const item = serviceOrder.items
      .getItems()
      .find((item) => item.id.toString() === itemId)

    if (!item) {
      return left(new ResourceNotFoundError())
    }

    serviceOrder.removeItem(item)

    await this.serviceOrdersRepository.save(serviceOrder)

    return right(null)
  }
}
