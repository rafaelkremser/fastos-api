import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { makeTenant } from 'test/factories/make-tenant'
import { makeUser } from 'test/factories/make-user'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { RegisterTenantUseCase } from './register-tenant'
import { TenantAlreadyExistsError } from './errors/tenant-already-exists-error'
import { InvalidTenantSlugError } from './errors/invalid-tenant-slug-error'
import { TenantSlugAlreadyInUseError } from './errors/tenant-slug-already-in-use-error'

let tenantsRepository: InMemoryTenantsRepository
let usersRepository: InMemoryUsersRepository
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
    sut = new RegisterTenantUseCase(
      tenantsRepository,
      usersRepository,
      new FakeHasher(),
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
})
