import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrder } from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { UsersRepository } from '@/domain/account/application/repositories/users-repository'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'

interface AssignTechnicianUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  technicianId: string
  assignedById: string
}

type AssignTechnicianUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class AssignTechnicianUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private usersRepository: UsersRepository,
    private historyRepository: ServiceOrderHistoryRepository,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    technicianId,
    assignedById,
  }: AssignTechnicianUseCaseRequest): Promise<AssignTechnicianUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    const technician = await this.usersRepository.findById(technicianId)

    if (!technician || technician.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const oldTechnicianId = serviceOrder.technicianId?.toString() ?? null

    serviceOrder.technicianId = new UniqueEntityID(technicianId)

    await this.serviceOrdersRepository.save(serviceOrder)

    const history = ServiceOrderHistory.create({
      serviceOrderId: new UniqueEntityID(serviceOrderId),
      userId: new UniqueEntityID(assignedById),
      action: 'TECHNICIAN_ASSIGNED',
      description: `Técnico atribuído: ${technician.name}`,
      oldValue: oldTechnicianId,
      newValue: technicianId,
    })

    await this.historyRepository.create(history)

    return right({ serviceOrder })
  }
}
