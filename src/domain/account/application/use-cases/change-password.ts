import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Hasher } from '../cryptography/hasher'
import { UsersRepository } from '../repositories/users-repository'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

interface ChangePasswordUseCaseRequest {
  userId: string
  currentPassword: string
  newPassword: string
}

type ChangePasswordUseCaseResponse = Either<
  NotAllowedError | WrongCredentialsError,
  null
>

// Someone changing their own password, which they prove they know. The
// sessions open on other devices stay open until they expire, since refresh
// tokens are not revoked (see the roadmap's debts)
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hasher: Hasher,
  ) {}

  async execute({
    userId,
    currentPassword,
    newPassword,
  }: ChangePasswordUseCaseRequest): Promise<ChangePasswordUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || !user.isActive) {
      return left(new NotAllowedError())
    }

    if (!(await this.hasher.compare(currentPassword, user.password))) {
      return left(new WrongCredentialsError())
    }

    user.password = await this.hasher.hash(newPassword)

    await this.usersRepository.save(user)

    return right(null)
  }
}
