import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { ChangeUserRoleUseCase } from './change-user-role'

let usersRepository: InMemoryUsersRepository
let sut: ChangeUserRoleUseCase

const tenantId = new UniqueEntityID()

function addUser(role: UserRole, override = {}) {
  const user = makeUser({ tenantId, role, ...override })
  usersRepository.items.push(user)
  return user
}

function request(manager: User, user: User, role: UserRole) {
  return {
    tenantId: tenantId.toString(),
    managerId: manager.id.toString(),
    userId: user.id.toString(),
    role,
  }
}

describe('Change User Role', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserRoleUseCase(usersRepository)
  })

  it.each<[UserRole, UserRole, UserRole]>([
    ['OWNER', 'TECHNICIAN', 'ADMIN'],
    ['OWNER', 'ADMIN', 'RECEPTIONIST'],
    ['ADMIN', 'TECHNICIAN', 'RECEPTIONIST'],
    ['ADMIN', 'RECEPTIONIST', 'TECHNICIAN'],
  ])('should let the %s turn a %s into a %s', async (managerRole, from, to) => {
    const manager = addUser(managerRole)
    const user = addUser(from)

    const result = await sut.execute(request(manager, user, to))

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items[1].role).toBe(to)
  })

  it.each<[string, UserRole, UserRole, UserRole]>([
    ['an admin promote someone to admin', 'ADMIN', 'TECHNICIAN', 'ADMIN'],
    ["an admin change another admin's role", 'ADMIN', 'ADMIN', 'TECHNICIAN'],
    ["anyone change the owner's role", 'OWNER', 'OWNER', 'ADMIN'],
    ['a technician change roles', 'TECHNICIAN', 'RECEPTIONIST', 'TECHNICIAN'],
    [
      'a receptionist change roles',
      'RECEPTIONIST',
      'TECHNICIAN',
      'RECEPTIONIST',
    ],
  ])('should not let %s', async (_, managerRole, from, to) => {
    const manager = addUser(managerRole)
    const user = addUser(from)

    const result = await sut.execute(request(manager, user, to))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(usersRepository.items[1].role).toBe(from)
  })

  it('should not let anyone change their own role', async () => {
    const admin = addUser('ADMIN')

    const result = await sut.execute(request(admin, admin, 'TECHNICIAN'))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(admin.role).toBe('ADMIN')
  })

  it('should not let a deactivated manager change roles', async () => {
    const formerAdmin = addUser('ADMIN', { isActive: false })
    const user = addUser('TECHNICIAN')

    const result = await sut.execute(request(formerAdmin, user, 'RECEPTIONIST'))

    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not find someone from another store', async () => {
    const owner = addUser('OWNER')
    const outsider = makeUser({ role: 'TECHNICIAN' })
    usersRepository.items.push(outsider)

    const result = await sut.execute(request(owner, outsider, 'RECEPTIONIST'))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(outsider.role).toBe('TECHNICIAN')
  })
})
