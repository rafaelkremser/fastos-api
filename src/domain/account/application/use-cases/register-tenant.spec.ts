import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { makeTenant } from 'test/factories/make-tenant'
import { makeUser } from 'test/factories/make-user'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { RegisterTenantUseCase } from './register-tenant'
import { TenantAlreadyExistsError } from './errors/tenant-already-exists-error'
import { InvalidTenantSlugError } from './errors/invalid-tenant-slug-error'
import { TenantSlugAlreadyInUseError } from './errors/tenant-slug-already-in-use-error'

let tenantsRepository: InMemoryTenantsRepository
let usersRepository: InMemoryUsersRepository
let hasher: FakeHasher
let transactionManager: FakeTransactionManager
let sut: RegisterTenantUseCase

const request = {
  tenantName: 'Assistência Tech',
  tenantEmail: 'contato@assistenciatech.com',
  ownerName: 'John Doe',
  ownerEmail: 'john@example.com',
  ownerPassword: '123456',
}

describe('Register Tenant', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    usersRepository = new InMemoryUsersRepository()
    hasher = new FakeHasher()
    transactionManager = new FakeTransactionManager()
    sut = new RegisterTenantUseCase(
      tenantsRepository,
      usersRepository,
      hasher,
      transactionManager,
    )
  })

  it('should register a tenant and its owner, deriving the slug from the name', async () => {
    const result = await sut.execute(request)

    expect(result.isRight()).toBe(true)
    expect(tenantsRepository.items[0].slug.value).toBe('assistencia-tech')
    expect(usersRepository.items[0]).toMatchObject({
      email: 'john@example.com',
      role: 'OWNER',
      password: '123456-hashed',
    })
    expect(usersRepository.items[0].tenantId).toEqual(
      tenantsRepository.items[0].id,
    )
  })

  it('should use the slug chosen by the owner', async () => {
    const result = await sut.execute({ ...request, tenantSlug: 'tech-centro' })

    expect(result.isRight()).toBe(true)
    expect(tenantsRepository.items[0].slug.value).toBe('tech-centro')
  })

  it('should reject an invalid chosen slug', async () => {
    const result = await sut.execute({ ...request, tenantSlug: 'admin' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidTenantSlugError)
    expect(tenantsRepository.items).toHaveLength(0)
  })

  it('should reject a name that does not produce a valid slug', async () => {
    const result = await sut.execute({ ...request, tenantName: 'AB' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidTenantSlugError)
  })

  it('should reject a slug already in use', async () => {
    tenantsRepository.items.push(
      makeTenant({ slug: Slug.create('assistencia-tech') }),
    )

    const result = await sut.execute(request)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TenantSlugAlreadyInUseError)
    expect(usersRepository.items).toHaveLength(0)
  })

  it('should reject a tenant email already in use', async () => {
    tenantsRepository.items.push(
      makeTenant({ email: 'contato@assistenciatech.com' }),
    )

    const result = await sut.execute(request)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TenantAlreadyExistsError)
  })

  it('should allow an owner email that already exists in another tenant', async () => {
    const otherTenant = makeTenant()
    tenantsRepository.items.push(otherTenant)
    usersRepository.items.push(
      makeUser({ tenantId: otherTenant.id, email: 'john@example.com' }),
    )

    const result = await sut.execute(request)

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items).toHaveLength(2)
  })
  it('should create the tenant and its owner in a single transaction', async () => {
    const insideTransaction: boolean[] = []
    const createTenant = tenantsRepository.create.bind(tenantsRepository)
    const createUser = usersRepository.create.bind(usersRepository)
    jest
      .spyOn(tenantsRepository, 'create')
      .mockImplementation(async (tenant) => {
        insideTransaction.push(transactionManager.isRunning)
        return createTenant(tenant)
      })
    jest.spyOn(usersRepository, 'create').mockImplementation(async (user) => {
      insideTransaction.push(transactionManager.isRunning)
      return createUser(user)
    })

    await sut.execute(request)

    expect(transactionManager.runs).toBe(1)
    expect(insideTransaction).toEqual([true, true])
  })

  it('should hash the password before opening the transaction', async () => {
    let hashedInsideTransaction: boolean | undefined
    const hash = hasher.hash.bind(hasher)
    jest.spyOn(hasher, 'hash').mockImplementation(async (plain) => {
      hashedInsideTransaction = transactionManager.isRunning
      return hash(plain)
    })

    await sut.execute(request)

    expect(hashedInsideTransaction).toBe(false)
  })
})
