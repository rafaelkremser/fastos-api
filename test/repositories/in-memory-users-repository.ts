import {
  UserFilters,
  UsersRepository,
} from '@/domain/account/application/repositories/users-repository'
import { User } from '@/domain/account/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByEmail(tenantId: string, email: string) {
    return (
      this.items.find(
        (item) => item.tenantId.toString() === tenantId && item.email === email,
      ) ?? null
    )
  }

  async findManyByTenantId(tenantId: string, filters: UserFilters = {}) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .filter((item) => !filters.role || item.role === filters.role)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async create(user: User) {
    this.items.push(user)
  }

  async save(user: User) {
    const index = this.items.findIndex((item) => item.id.equals(user.id))
    this.items[index] = user
  }

  async delete(user: User) {
    this.items = this.items.filter((item) => !item.id.equals(user.id))
  }
}
