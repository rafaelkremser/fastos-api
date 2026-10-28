import { Injectable } from '@nestjs/common'
import {
  UserFilters,
  UsersRepository,
} from '@/domain/account/application/repositories/users-repository'
import { User } from '@/domain/account/enterprise/entities/user'
import { PrismaService } from '../prisma.service'
import { PrismaUserMapper } from '../mappers/prisma-user-mapper'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        tenantId,
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findManyByTenantId(
    tenantId: string,
    filters: UserFilters = {},
  ): Promise<User[]> {
    const users = await this.prisma.client.user.findMany({
      where: {
        tenantId,
        ...(filters.role && { role: filters.role }),
      },
      orderBy: { name: 'asc' },
    })

    return users.map(PrismaUserMapper.toDomain)
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.client.user.create({
      data,
    })
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.client.user.update({
      where: { id: data.id },
      data,
    })
  }

  async delete(user: User): Promise<void> {
    await this.prisma.client.user.delete({
      where: { id: user.id.toString() },
    })
  }
}
