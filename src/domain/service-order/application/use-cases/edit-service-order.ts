import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrder, OrderPriority } from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'

// The technician is not here: AssignTechnicianUseCase changes it, checking the
// role and the store and recording it in the history
interface EditServiceOrderUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  problemDescription?: string
  diagnosis?: string | null
  solution?: string | null
  priority?: OrderPriority
  estimatedDate?: Date | null
  estimatedCost?: number | null
  finalCost?: number | null
  discount?: number
  internalNotes?: string | null
  customerNotes?: string | null
}

type EditServiceOrderUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class EditServiceOrderUseCase {
  constructor(private serviceOrdersRepository: ServiceOrdersRepository) {}

  async execute({
    tenantId,
    serviceOrderId,
    problemDescription,
    diagnosis,
    solution,
    priority,
    estimatedDate,
    estimatedCost,
    finalCost,
    discount,
    internalNotes,
    customerNotes,
  }: EditServiceOrderUseCaseRequest): Promise<EditServiceOrderUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    if (problemDescription !== undefined) {
      serviceOrder.problemDescription = problemDescription
    }

    if (diagnosis !== undefined) {
      serviceOrder.diagnosis = diagnosis
    }

    if (solution !== undefined) {
      serviceOrder.solution = solution
    }

    if (priority !== undefined) {
      serviceOrder.priority = priority
    }

    if (estimatedDate !== undefined) {
      serviceOrder.estimatedDate = estimatedDate
    }

    if (estimatedCost !== undefined) {
      serviceOrder.estimatedCost = estimatedCost
    }

    if (finalCost !== undefined) {
      serviceOrder.finalCost = finalCost
    }

    if (discount !== undefined) {
      serviceOrder.discount = discount
    }

    if (internalNotes !== undefined) {
      serviceOrder.internalNotes = internalNotes
    }

    if (customerNotes !== undefined) {
      serviceOrder.customerNotes = customerNotes
    }

    await this.serviceOrdersRepository.save(serviceOrder)

    return right({ serviceOrder })
  }
}
