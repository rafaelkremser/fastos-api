import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { makeTenant } from 'test/factories/make-tenant'
import { makeUser } from 'test/factories/make-user'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { AuthenticateUserUseCase } from './authenticate-user'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { InactiveTenantError } from './errors/inactive-tenant-error'

let tenantsRepository: InMemoryTenantsRepository
let usersRepository: InMemoryUsersRepository
let hasher: FakeHasher
let sut: AuthenticateUserUseCase

function tokenPayload(token: string) {
  return JSON.parse(token) as Record<string, unknown>
}

describe('Authenticate User', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    usersRepository = new InMemoryUsersRepository()
    hasher = new FakeHasher()
    sut = new AuthenticateUserUseCase(
      tenantsRepository,
      usersRepository,
      hasher,
      new FakeEncrypter(),
    )
  })

  it('should authenticate a user within its tenant', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a') })
    const user = makeUser({
      tenantId: tenant.id,
      email: 'john@example.com',
      password: '123456-hashed',
    })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(user)

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(tokenPayload(result.value.accessToken)).toEqual({
        sub: user.id.toString(),
        tenantId: tenant.id.toString(),
        role: user.role,
        type: 'access',
        expiresInSeconds: 15 * 60,
      })
      expect(tokenPayload(result.value.refreshToken)).toEqual({
        sub: user.id.toString(),
        tenantId: tenant.id.toString(),
        type: 'refresh',
        expiresInSeconds: 7 * 24 * 60 * 60,
      })
    }
  })

  it('should log into the right tenant when the same email exists in two tenants', async () => {
    const tenantA = makeTenant({ slug: Slug.create('loja-a') })
    const tenantB = makeTenant({ slug: Slug.create('loja-b') })
    tenantsRepository.items.push(tenantA, tenantB)
    usersRepository.items.push(
      makeUser({
        tenantId: tenantA.id,
        email: 'tech@example.com',
        password: 'senha-a-hashed',
      }),
      makeUser({
        tenantId: tenantB.id,
        email: 'tech@example.com',
        password: 'senha-b-hashed',
      }),
    )

    const intoA = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'tech@example.com',
      password: 'senha-a',
    })
    const intoB = await sut.execute({
      tenantSlug: 'loja-b',
      email: 'tech@example.com',
      password: 'senha-b',
    })

    expect(
      intoA.isRight() && tokenPayload(intoA.value.accessToken).tenantId,
    ).toBe(tenantA.id.toString())
    expect(
      intoB.isRight() && tokenPayload(intoB.value.accessToken).tenantId,
    ).toBe(tenantB.id.toString())
  })

  it('should not authenticate with the password of the same email in another tenant', async () => {
    const tenantA = makeTenant({ slug: Slug.create('loja-a') })
    const tenantB = makeTenant({ slug: Slug.create('loja-b') })
    tenantsRepository.items.push(tenantA, tenantB)
    usersRepository.items.push(
      makeUser({
        tenantId: tenantA.id,
        email: 'tech@example.com',
        password: 'senha-a-hashed',
      }),
      makeUser({
        tenantId: tenantB.id,
        email: 'tech@example.com',
        password: 'senha-b-hashed',
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-b',
      email: 'tech@example.com',
      password: 'senha-a',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not authenticate a user in a tenant where it has no account', async () => {
    const tenantA = makeTenant({ slug: Slug.create('loja-a') })
    const tenantB = makeTenant({ slug: Slug.create('loja-b') })
    tenantsRepository.items.push(tenantA, tenantB)
    usersRepository.items.push(
      makeUser({
        tenantId: tenantA.id,
        email: 'john@example.com',
        password: '123456-hashed',
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-b',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not authenticate with an unknown tenant slug', async () => {
    const result = await sut.execute({
      tenantSlug: 'nao-existe',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should tell a user with the right password that the tenant is inactive', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a'), isActive: false })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(
      makeUser({
        tenantId: tenant.id,
        email: 'john@example.com',
        password: '123456-hashed',
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(InactiveTenantError)
  })

  it('should not reveal that the tenant is inactive to a wrong password', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a'), isActive: false })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(
      makeUser({
        tenantId: tenant.id,
        email: 'john@example.com',
        password: '123456-hashed',
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'john@example.com',
      password: 'wrong',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not authenticate an inactive user', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a') })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(
      makeUser({
        tenantId: tenant.id,
        email: 'john@example.com',
        password: '123456-hashed',
        isActive: false,
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not authenticate with a wrong password', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a') })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(
      makeUser({
        tenantId: tenant.id,
        email: 'john@example.com',
        password: '123456-hashed',
      }),
    )

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'john@example.com',
      password: 'wrong',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should check a password even when the email has no account', async () => {
    tenantsRepository.items.push(makeTenant({ slug: Slug.create('loja-a') }))
    const compare = jest.spyOn(hasher, 'compare')

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'ninguem@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
    expect(compare).toHaveBeenCalledWith('123456', null)
  })

  it('should check a password even when the tenant does not exist', async () => {
    const compare = jest.spyOn(hasher, 'compare')

    const result = await sut.execute({
      tenantSlug: 'nao-existe',
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
    expect(compare).toHaveBeenCalledWith('123456', null)
  })
})
