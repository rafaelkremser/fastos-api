import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { Tenant } from '../../enterprise/entities/tenant'
import { User } from '../../enterprise/entities/user'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { TenantAlreadyExistsError } from './errors/tenant-already-exists-error'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface RegisterTenantUseCaseRequest {
  tenantName: string
  tenantEmail: string
  tenantDocument?: string | null
  tenantPhone?: string | null
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

type RegisterTenantUseCaseResponse = Either<
  TenantAlreadyExistsError | UserAlreadyExistsError,
  {
    tenant: Tenant
    user: User
  }
>

@Injectable()
export class RegisterTenantUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private usersRepository: UsersRepository,
    private hasher: Hasher,
  ) {}

  async execute({
    tenantName,
    tenantEmail,
    tenantDocument,
    tenantPhone,
    ownerName,
    ownerEmail,
    ownerPassword,
  }: RegisterTenantUseCaseRequest): Promise<RegisterTenantUseCaseResponse> {
    const tenantWithSameEmail =
      await this.tenantsRepository.findByEmail(tenantEmail)

    if (tenantWithSameEmail) {
      return left(new TenantAlreadyExistsError(tenantEmail))
    }

    const userWithSameEmail =
      await this.usersRepository.findByEmailGlobal(ownerEmail)

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(ownerEmail))
    }

    const tenant = Tenant.create({
      name: tenantName,
      email: tenantEmail,
      document: tenantDocument ?? null,
      phone: tenantPhone ?? null,
    })

    await this.tenantsRepository.create(tenant)

    const hashedPassword = await this.hasher.hash(ownerPassword)

    const user = User.create({
      tenantId: tenant.id,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'OWNER',
    })

    await this.usersRepository.create(user)

    return right({
      tenant,
      user,
    })
  }
}
