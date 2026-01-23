import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { Encrypter } from '../cryptography/encrypter'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

interface AuthenticateUserUseCaseRequest {
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
    private usersRepository: UsersRepository,
    private hasher: Hasher,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    const user = await this.usersRepository.findByEmailGlobal(email)

    console.log('user', user)

    if (!user) {
      return left(new WrongCredentialsError())
    }

    if (!user.isActive) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hasher.compare(password, user.password)

    if (!isPasswordValid) {
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
