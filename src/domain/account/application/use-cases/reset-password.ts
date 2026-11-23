import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Hasher } from '../cryptography/hasher'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'

interface ResetPasswordUseCaseRequest {
  tenantSlug: string
  email: string
  newPassword: string
}

type ResetPasswordUseCaseResponse = Either<ResourceNotFoundError, null>

// For whoever forgot their password, until there is a reset by e-mail: the
// Consertiva team sets a temporary one by command, and the person changes it
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private usersRepository: UsersRepository,
    private hasher: Hasher,
  ) {}

  async execute({
    tenantSlug,
    email,
    newPassword,
  }: ResetPasswordUseCaseRequest): Promise<ResetPasswordUseCaseResponse> {
    const tenant = await this.tenantsRepository.findBySlug(tenantSlug)

    const user = tenant
      ? await this.usersRepository.findByEmail(tenant.id.toString(), email)
      : null

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    user.password = await this.hasher.hash(newPassword)

    await this.usersRepository.save(user)

    return right(null)
  }
}
