import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { Encrypter } from '../cryptography/encrypter'
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../cryptography/tokens'
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
    refreshToken: string
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

    const sub = user.id.toString()
    const tenantId = user.tenantId.toString()

    const accessToken = await this.encrypter.encrypt(
      { sub, tenantId, role: user.role, type: 'access' },
      ACCESS_TOKEN_TTL_SECONDS,
    )

    const refreshToken = await this.encrypter.encrypt(
      { sub, tenantId, type: 'refresh' },
      REFRESH_TOKEN_TTL_SECONDS,
    )

    return right({
      accessToken,
      refreshToken,
    })
  }
}
