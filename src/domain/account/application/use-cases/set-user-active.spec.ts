import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { User, UserRole } from '../../enterprise/entities/user'
import { SetUserActiveUseCase } from './set-user-active'

let usersRepository: InMemoryUsersRepository
let sut: SetUserActiveUseCase

const tenantId = new UniqueEntityID()

function addUser(role: UserRole, override = {}) {
  const user = makeUser({ tenantId, role, ...override })
  usersRepository.items.push(user)
  return user
}

function request(manager: User, user: User, isActive: boolean) {
  return {
    tenantId: tenantId.toString(),
    managerId: manager.id.toString(),
    userId: user.id.toString(),
    isActive,
  }
}

describe('Set User Active', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new SetUserActiveUseCase(usersRepository)
  })

  it('should deactivate someone and bring them back', async () => {
    const owner = addUser('OWNER')
    const technician = addUser('TECHNICIAN')

    const deactivated = await sut.execute(request(owner, technician, false))

    expect(deactivated.isRight()).toBe(true)
    expect(technician.isActive).toBe(false)

    const reactivated = await sut.execute(request(owner, technician, true))

    expect(reactivated.isRight()).toBe(true)
    expect(technician.isActive).toBe(true)
  })

  it.each<[UserRole, UserRole]>([
    ['OWNER', 'ADMIN'],
    ['ADMIN', 'TECHNICIAN'],
    ['ADMIN', 'RECEPTIONIST'],
  ])('should let the %s deactivate a %s', async (managerRole, role) => {
    const manager = addUser(managerRole)
    const user = addUser(role)

    const result = await sut.execute(request(manager, user, false))

    expect(result.isRight()).toBe(true)
    expect(user.isActive).toBe(false)
  })

  it.each<[string, UserRole, UserRole]>([
    ['an admin deactivate another admin', 'ADMIN', 'ADMIN'],
    ['anyone deactivate the owner', 'OWNER', 'OWNER'],
    ['a technician deactivate anyone', 'TECHNICIAN', 'RECEPTIONIST'],
  ])('should not let %s', async (_, managerRole, role) => {
    const manager = addUser(managerRole)
    const user = addUser(role)

    const result = await sut.execute(request(manager, user, false))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(user.isActive).toBe(true)
  })

  it('should not let anyone deactivate themselves', async () => {
    const admin = addUser('ADMIN')

    const result = await sut.execute(request(admin, admin, false))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(admin.isActive).toBe(true)
  })

  it('should not find someone from another store', async () => {
    const owner = addUser('OWNER')
    const outsider = makeUser({ role: 'TECHNICIAN' })
    usersRepository.items.push(outsider)

    const result = await sut.execute(request(owner, outsider, false))

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(outsider.isActive).toBe(true)
  })
})
