import { User } from '../../enterprise/entities/user'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(tenantId: string, email: string): Promise<User | null>
  abstract findByEmailGlobal(email: string): Promise<User | null>
  abstract findManyByTenantId(tenantId: string): Promise<User[]>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
