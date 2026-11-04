import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface ChangeUserRoleUseCaseRequest {
  tenantId: string
  managerId: string
  userId: string
  role: UserRole
}

type ChangeUserRoleUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { user: User }
>

// The new role reaches the person's token on its next refresh, within the
// 15 minutes an access token lasts
@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    tenantId,
    managerId,
    userId,
    role,
  }: ChangeUserRoleUseCaseRequest): Promise<ChangeUserRoleUseCaseResponse> {
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

    if (!manager.canManage(user) || !manager.canAssignRole(role)) {
      return left(new NotAllowedError())
    }

    user.role = role

    await this.usersRepository.save(user)

    return right({ user })
  }
}
