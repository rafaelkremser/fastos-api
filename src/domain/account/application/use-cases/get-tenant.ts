import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Tenant } from '../../enterprise/entities/tenant'
import { TenantsRepository } from '../repositories/tenants-repository'

interface GetTenantUseCaseRequest {
  id: string
}

type GetTenantUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    tenant: Tenant
  }
>

@Injectable()
export class GetTenantUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    id,
  }: GetTenantUseCaseRequest): Promise<GetTenantUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(id)

    if (!tenant) {
      return left(new ResourceNotFoundError())
    }

    return right({
      tenant,
    })
  }
}
