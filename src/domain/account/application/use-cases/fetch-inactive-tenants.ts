import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { Tenant } from '../../enterprise/entities/tenant'
import { TenantsRepository } from '../repositories/tenants-repository'

type FetchInactiveTenantsUseCaseResponse = Either<
  null,
  {
    tenants: Tenant[]
  }
>

@Injectable()
export class FetchInactiveTenantsUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute(): Promise<FetchInactiveTenantsUseCaseResponse> {
    const tenants = await this.tenantsRepository.findManyInactive()

    return right({
      tenants,
    })
  }
}
