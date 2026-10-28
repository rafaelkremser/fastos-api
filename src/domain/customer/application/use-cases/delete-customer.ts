import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'
import { ServiceOrdersRepository } from '@/domain/service-order/application/repositories/service-orders-repository'
import { CustomersRepository } from '../repositories/customers-repository'
import { CustomerHasServiceOrdersError } from './errors/customer-has-service-orders-error'

interface DeleteCustomerUseCaseRequest {
  tenantId: string
  customerId: string
}

type DeleteCustomerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | CustomerHasServiceOrdersError,
  null
>

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    private customersRepository: CustomersRepository,
    private devicesRepository: DevicesRepository,
    private serviceOrdersRepository: ServiceOrdersRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantId,
    customerId,
  }: DeleteCustomerUseCaseRequest): Promise<DeleteCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer) {
      return left(new ResourceNotFoundError())
    }

    if (customer.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    // Service orders are the store's history, so they keep their customer
    const serviceOrders = await this.serviceOrdersRepository.count(tenantId, {
      customerId,
    })

    if (serviceOrders > 0) {
      return left(new CustomerHasServiceOrdersError())
    }

    // Devices only exist for their customer, so they go with it
    await this.transactionManager.run(async () => {
      await this.devicesRepository.deleteManyByCustomerId(tenantId, customerId)
      await this.customersRepository.delete(customer)
    })

    return right(null)
  }
}
