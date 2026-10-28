import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Tenant } from '../../enterprise/entities/tenant'
import { TenantsRepository } from '../repositories/tenants-repository'

interface ActivateTenantUseCaseRequest {
  slug: string
}

type ActivateTenantUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    tenant: Tenant
  }
>

@Injectable()
export class ActivateTenantUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    slug,
  }: ActivateTenantUseCaseRequest): Promise<ActivateTenantUseCaseResponse> {
    const tenant = await this.tenantsRepository.findBySlug(slug)

    if (!tenant) {
      return left(new ResourceNotFoundError())
    }

    tenant.activate()

    await this.tenantsRepository.save(tenant)

    return right({
      tenant,
    })
  }
}
