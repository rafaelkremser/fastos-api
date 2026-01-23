import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderItem, ItemType } from '../../enterprise/entities/service-order-item'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderItemsRepository } from '../repositories/service-order-items-repository'

interface AddServiceOrderItemUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  type: ItemType
  description: string
  quantity: number
  unitPrice: number
}

type AddServiceOrderItemUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { item: ServiceOrderItem }
>

@Injectable()
export class AddServiceOrderItemUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private serviceOrderItemsRepository: ServiceOrderItemsRepository,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    type,
    description,
    quantity,
    unitPrice,
  }: AddServiceOrderItemUseCaseRequest): Promise<AddServiceOrderItemUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    const item = ServiceOrderItem.create({
      serviceOrderId: new UniqueEntityID(serviceOrderId),
      type,
      description,
      quantity,
      unitPrice,
    })

    await this.serviceOrderItemsRepository.create(item)

    return right({ item })
  }
}
