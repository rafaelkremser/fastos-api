import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CustomersRepository } from '../repositories/customers-repository'

interface DeleteCustomerUseCaseRequest {
  tenantId: string
  customerId: string
}

type DeleteCustomerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

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

    await this.customersRepository.delete(customer)

    return right(null)
  }
}
