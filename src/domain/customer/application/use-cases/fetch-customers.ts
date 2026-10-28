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
    // Across all pages, so the client can show how many pages there are
    totalCount: number
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
    const [customers, totalCount] = search
      ? await Promise.all([
          this.customersRepository.searchByName(tenantId, search, {
            page,
            perPage,
          }),
          this.customersRepository.countByName(tenantId, search),
        ])
      : await Promise.all([
          this.customersRepository.findMany(tenantId, { page, perPage }),
          this.customersRepository.countByTenantId(tenantId),
        ])

    return right({
      customers,
      totalCount,
    })
  }
}
