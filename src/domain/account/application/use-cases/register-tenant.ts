import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { Tenant } from '../../enterprise/entities/tenant'
import { User } from '../../enterprise/entities/user'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { TenantAlreadyExistsError } from './errors/tenant-already-exists-error'
import { InvalidTenantSlugError } from './errors/invalid-tenant-slug-error'
import { TenantSlugAlreadyInUseError } from './errors/tenant-slug-already-in-use-error'

interface RegisterTenantUseCaseRequest {
  tenantName: string
  tenantEmail: string
  tenantSlug?: string | null
  tenantDocument?: string | null
  tenantPhone?: string | null
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

type RegisterTenantUseCaseResponse = Either<
  | TenantAlreadyExistsError
  | InvalidTenantSlugError
  | TenantSlugAlreadyInUseError,
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
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantName,
    tenantEmail,
    tenantSlug,
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

    const slug = tenantSlug
      ? Slug.create(tenantSlug)
      : Slug.createFromText(tenantName)

    if (!slug.isValid()) {
      return left(new InvalidTenantSlugError(slug.value))
    }

    const tenantWithSameSlug = await this.tenantsRepository.findBySlug(
      slug.value,
    )

    if (tenantWithSameSlug) {
      return left(new TenantSlugAlreadyInUseError(slug.value))
    }

    const tenant = Tenant.create({
      name: tenantName,
      slug,
      email: tenantEmail,
      document: tenantDocument ?? null,
      phone: tenantPhone ?? null,
    })

    const hashedPassword = await this.hasher.hash(ownerPassword)

    const user = User.create({
      tenantId: tenant.id,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'OWNER',
    })

    // A tenant without its owner would be unusable, so both writes or neither
    await this.transactionManager.run(async () => {
      await this.tenantsRepository.create(tenant)
      await this.usersRepository.create(user)
    })

    return right({
      tenant,
      user,
    })
  }
}
