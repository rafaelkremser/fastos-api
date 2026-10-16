import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface CreateUserUseCaseRequest {
  tenantId: string
  creatorId: string
  name: string
  email: string
  password: string
  role?: UserRole
}

type CreateUserUseCaseResponse = Either<
  NotAllowedError | UserAlreadyExistsError,
  {
    user: User
  }
>

@Injectable()
export class CreateUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hasher: Hasher,
  ) {}

  async execute({
    tenantId,
    creatorId,
    name,
    email,
    password,
    role = 'TECHNICIAN',
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
    // Loaded from the database, not the token, so a role change applies at once
    const creator = await this.usersRepository.findById(creatorId)

    if (
      !creator ||
      !creator.isActive ||
      creator.tenantId.toString() !== tenantId ||
      !creator.canAssignRole(role)
    ) {
      return left(new NotAllowedError())
    }

    const userWithSameEmail = await this.usersRepository.findByEmail(
      tenantId,
      email,
    )

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(email))
    }

    const hashedPassword = await this.hasher.hash(password)

    const user = User.create({
      tenantId: new UniqueEntityID(tenantId),
      name,
      email,
      password: hashedPassword,
      role,
    })

    await this.usersRepository.create(user)

    return right({
      user,
    })
  }
}
