import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface FetchUsersUseCaseRequest {
  tenantId: string
  role?: UserRole
}

type FetchUsersUseCaseResponse = Either<
  null,
  {
    users: User[]
  }
>

@Injectable()
export class FetchUsersUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    tenantId,
    role,
  }: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
    const users = await this.usersRepository.findManyByTenantId(tenantId, {
      role,
    })

    return right({
      users,
    })
  }
}
