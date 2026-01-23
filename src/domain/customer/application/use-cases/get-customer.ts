import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Customer } from '../../enterprise/entities/customer'
import { CustomersRepository } from '../repositories/customers-repository'

interface GetCustomerUseCaseRequest {
  tenantId: string
  customerId: string
}

type GetCustomerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    customer: Customer
  }
>

@Injectable()
export class GetCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute({
    tenantId,
    customerId,
  }: GetCustomerUseCaseRequest): Promise<GetCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer) {
      return left(new ResourceNotFoundError())
    }

    if (customer.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    return right({
      customer,
    })
  }
}
