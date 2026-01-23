import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { Customer } from '../../enterprise/entities/customer'
import { CustomersRepository } from '../repositories/customers-repository'

interface FetchCustomersUseCaseRequest {
  tenantId: string
  page: number
  perPage?: number
  search?: string
}

type FetchCustomersUseCaseResponse = Either<
  null,
  {
    customers: Customer[]
  }
>

@Injectable()
export class FetchCustomersUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute({
    tenantId,
    page,
    perPage,
    search,
  }: FetchCustomersUseCaseRequest): Promise<FetchCustomersUseCaseResponse> {
    let customers: Customer[]

    if (search) {
      customers = await this.customersRepository.searchByName(tenantId, search, {
        page,
        perPage,
      })
    } else {
      customers = await this.customersRepository.findMany(tenantId, {
        page,
        perPage,
      })
    }

    return right({
      customers,
    })
  }
}
