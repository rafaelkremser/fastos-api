import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ServiceOrder, OrderPriority } from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'

interface CreateServiceOrderUseCaseRequest {
  tenantId: string
  customerId: string
  deviceId: string
  createdById: string
  problemDescription: string
  priority?: OrderPriority
  estimatedDate?: Date
  internalNotes?: string
}

type CreateServiceOrderUseCaseResponse = Either<
  ResourceNotFoundError,
  { serviceOrder: ServiceOrder }
>

@Injectable()
export class CreateServiceOrderUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private customersRepository: CustomersRepository,
    private devicesRepository: DevicesRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantId,
    customerId,
    deviceId,
    createdById,
    problemDescription,
    priority,
    estimatedDate,
    internalNotes,
  }: CreateServiceOrderUseCaseRequest): Promise<CreateServiceOrderUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer || customer.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const device = await this.devicesRepository.findById(deviceId)

    if (!device || device.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    // Concurrent orders of the tenant wait for each other here, and a failed
    // creation gives the number back
    const serviceOrder = await this.transactionManager.run(async () => {
      const number =
        await this.serviceOrdersRepository.reserveNextNumber(tenantId)

      const serviceOrder = ServiceOrder.create({
        tenantId: new UniqueEntityID(tenantId),
        customerId: new UniqueEntityID(customerId),
        deviceId: new UniqueEntityID(deviceId),
        createdById: new UniqueEntityID(createdById),
        number,
        problemDescription,
        priority,
        estimatedDate: estimatedDate ?? null,
        internalNotes: internalNotes ?? null,
        technicianId: null,
        diagnosis: null,
        solution: null,
        completedDate: null,
        deliveredDate: null,
        estimatedCost: null,
        finalCost: null,
        customerNotes: null,
        warrantyUntil: null,
      })

      await this.serviceOrdersRepository.create(serviceOrder)

      return serviceOrder
    })

    return right({ serviceOrder })
  }
}
