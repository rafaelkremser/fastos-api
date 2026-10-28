import { User, UserRole } from '../../enterprise/entities/user'

export interface UserFilters {
  role?: UserRole
}

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(tenantId: string, email: string): Promise<User | null>
  // Sorted by name; a store's team is small enough to come in one page
  abstract findManyByTenantId(
    tenantId: string,
    filters?: UserFilters,
  ): Promise<User[]>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
