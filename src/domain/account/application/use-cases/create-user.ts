import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'
import { Hasher } from '../cryptography/hasher'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface CreateUserUseCaseRequest {
  tenantId: string
  name: string
  email: string
  password: string
  role?: UserRole
}

type CreateUserUseCaseResponse = Either<
  UserAlreadyExistsError,
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
    name,
    email,
    password,
    role,
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
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
