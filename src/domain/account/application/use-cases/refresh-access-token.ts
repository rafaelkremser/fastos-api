import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TenantsRepository } from '../repositories/tenants-repository'
import { UsersRepository } from '../repositories/users-repository'
import { Encrypter } from '../cryptography/encrypter'
import { Decrypter } from '../cryptography/decrypter'
import {
  ACCESS_TOKEN_TTL_SECONDS,
  isRefreshTokenClaims,
} from '../cryptography/tokens'
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token-error'

interface RefreshAccessTokenUseCaseRequest {
  refreshToken: string
}

type RefreshAccessTokenUseCaseResponse = Either<
  InvalidRefreshTokenError,
  {
    accessToken: string
  }
>

// The refresh token is not renewed: the session ends 7 days after login
@Injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private usersRepository: UsersRepository,
    private encrypter: Encrypter,
    private decrypter: Decrypter,
  ) {}

  async execute({
    refreshToken,
  }: RefreshAccessTokenUseCaseRequest): Promise<RefreshAccessTokenUseCaseResponse> {
    const claims = await this.decrypter.decrypt(refreshToken)

    if (!isRefreshTokenClaims(claims)) {
      return left(new InvalidRefreshTokenError())
    }

    // Read from the database, not the old token, so a deactivated user or
    // tenant loses access and a role change applies on the next renewal
    const user = await this.usersRepository.findById(claims.sub)

    if (
      !user ||
      !user.isActive ||
      user.tenantId.toString() !== claims.tenantId
    ) {
      return left(new InvalidRefreshTokenError())
    }

    const tenant = await this.tenantsRepository.findById(claims.tenantId)

    if (!tenant || !tenant.isActive) {
      return left(new InvalidRefreshTokenError())
    }

    const accessToken = await this.encrypter.encrypt(
      {
        sub: claims.sub,
        tenantId: claims.tenantId,
        role: user.role,
        type: 'access',
      },
      ACCESS_TOKEN_TTL_SECONDS,
    )

    return right({ accessToken })
  }
}
