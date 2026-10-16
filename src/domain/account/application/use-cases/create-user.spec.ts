import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { UserRole } from '../../enterprise/entities/user'
import { CreateUserUseCase } from './create-user'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

let usersRepository: InMemoryUsersRepository
let sut: CreateUserUseCase

const tenantId = new UniqueEntityID()

function addCreator(role: UserRole, override = {}) {
  const creator = makeUser({ tenantId, role, ...override })
  usersRepository.items.push(creator)
  return creator
}

function request(creatorId: UniqueEntityID, role?: UserRole) {
  return {
    tenantId: tenantId.toString(),
    creatorId: creatorId.toString(),
    name: 'New Teammate',
    email: 'teammate@example.com',
    password: '123456',
    role,
  }
}

describe('Create User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new CreateUserUseCase(usersRepository, new FakeHasher())
  })

  it.each<[UserRole, UserRole]>([
    ['OWNER', 'ADMIN'],
    ['OWNER', 'TECHNICIAN'],
    ['OWNER', 'RECEPTIONIST'],
    ['ADMIN', 'TECHNICIAN'],
    ['ADMIN', 'RECEPTIONIST'],
  ])('should let %s create a %s', async (creatorRole, role) => {
    const creator = addCreator(creatorRole)

    const result = await sut.execute(request(creator.id, role))

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items[1]).toMatchObject({
      role,
      password: '123456-hashed',
    })
    expect(usersRepository.items[1].tenantId).toEqual(tenantId)
  })

  it('should create a technician when no role is given', async () => {
    const creator = addCreator('ADMIN')

    const result = await sut.execute(request(creator.id))

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items[1].role).toBe('TECHNICIAN')
  })

  it.each<[UserRole, UserRole]>([
    ['ADMIN', 'ADMIN'],
    ['ADMIN', 'OWNER'],
    ['OWNER', 'OWNER'],
    ['TECHNICIAN', 'TECHNICIAN'],
    ['RECEPTIONIST', 'RECEPTIONIST'],
  ])('should not let %s create a %s', async (creatorRole, role) => {
    const creator = addCreator(creatorRole)

    const result = await sut.execute(request(creator.id, role))

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(usersRepository.items).toHaveLength(1)
  })

  it('should not let a creator from another tenant create users', async () => {
    const creator = addCreator('OWNER', { tenantId: new UniqueEntityID() })

    const result = await sut.execute(request(creator.id, 'TECHNICIAN'))

    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not let an inactive creator create users', async () => {
    const creator = addCreator('OWNER', { isActive: false })

    const result = await sut.execute(request(creator.id, 'TECHNICIAN'))

    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not let an unknown creator create users', async () => {
    const result = await sut.execute(
      request(new UniqueEntityID(), 'TECHNICIAN'),
    )

    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not create two users with the same email in a tenant', async () => {
    const creator = addCreator('OWNER')
    usersRepository.items.push(
      makeUser({ tenantId, email: 'teammate@example.com' }),
    )

    const result = await sut.execute(request(creator.id, 'TECHNICIAN'))

    expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
  })

  it('should allow an email that exists in another tenant', async () => {
    const creator = addCreator('OWNER')
    usersRepository.items.push(
      makeUser({
        tenantId: new UniqueEntityID(),
        email: 'teammate@example.com',
      }),
    )

    const result = await sut.execute(request(creator.id, 'TECHNICIAN'))

    expect(result.isRight()).toBe(true)
  })
})
