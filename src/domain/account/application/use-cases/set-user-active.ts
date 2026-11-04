import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface SetUserActiveUseCaseRequest {
  tenantId: string
  managerId: string
  userId: string
  isActive: boolean
}

type SetUserActiveUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { user: User }
>

// Someone deactivated can no longer sign in, and their next token refresh is
// refused, so they are out within the 15 minutes an access token lasts. Their
// orders and history stay as they were
@Injectable()
export class SetUserActiveUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    tenantId,
    managerId,
    userId,
    isActive,
  }: SetUserActiveUseCaseRequest): Promise<SetUserActiveUseCaseResponse> {
    // Loaded from the database, not the token, so a role change applies at once
    const manager = await this.usersRepository.findById(managerId)

    if (
      !manager ||
      !manager.isActive ||
      manager.tenantId.toString() !== tenantId
    ) {
      return left(new NotAllowedError())
    }

    const user = await this.usersRepository.findById(userId)

    if (!user || user.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    if (!manager.canManage(user)) {
      return left(new NotAllowedError())
    }

    if (isActive) {
      user.activate()
    } else {
      user.deactivate()
    }

    await this.usersRepository.save(user)

    return right({ user })
  }
}
