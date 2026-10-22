import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { Encrypter } from '../cryptography/encrypter'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

interface AuthenticateUserUseCaseRequest {
  tenantSlug: string
  email: string
  password: string
}

type AuthenticateUserUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private usersRepository: UsersRepository,
    private hasher: Hasher,
    private encrypter: Encrypter,
  ) {}

  async execute({
    tenantSlug,
    email,
    password,
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    const tenant = await this.tenantsRepository.findBySlug(tenantSlug)

    const user = tenant?.isActive
      ? await this.usersRepository.findByEmail(tenant.id.toString(), email)
      : null

    // Checked even without a user, so the response time does not reveal
    // which emails have an account
    const isPasswordValid = await this.hasher.compare(
      password,
      user?.password ?? null,
    )

    if (!user || !user.isActive || !isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    })

    return right({
      accessToken,
    })
  }
}
