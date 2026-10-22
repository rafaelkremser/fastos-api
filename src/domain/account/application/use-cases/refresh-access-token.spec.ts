import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { FakeDecrypter } from 'test/cryptography/fake-decrypter'
import { makeTenant } from 'test/factories/make-tenant'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RefreshAccessTokenUseCase } from './refresh-access-token'
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token-error'

let tenantsRepository: InMemoryTenantsRepository
let usersRepository: InMemoryUsersRepository
let sut: RefreshAccessTokenUseCase

function setup(userOverride = {}, tenantOverride = {}) {
  const tenant = makeTenant(tenantOverride)
  const user = makeUser({
    tenantId: tenant.id,
    role: 'TECHNICIAN',
    ...userOverride,
  })
  tenantsRepository.items.push(tenant)
  usersRepository.items.push(user)
  return { tenant, user }
}

function refreshTokenFor(sub: string, tenantId: string, type = 'refresh') {
  return JSON.stringify({ sub, tenantId, type })
}

describe('Refresh Access Token', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new RefreshAccessTokenUseCase(
      tenantsRepository,
      usersRepository,
      new FakeEncrypter(),
      new FakeDecrypter(),
    )
  })

  it('should issue a 15-minute access token from a refresh token', async () => {
    const { tenant, user } = setup()

    const result = await sut.execute({
      refreshToken: refreshTokenFor(user.id.toString(), tenant.id.toString()),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(JSON.parse(result.value.accessToken)).toEqual({
        sub: user.id.toString(),
        tenantId: tenant.id.toString(),
        role: 'TECHNICIAN',
        type: 'access',
        expiresInSeconds: 15 * 60,
      })
    }
  })

  it('should not hand out a new refresh token', async () => {
    const { tenant, user } = setup()

    const result = await sut.execute({
      refreshToken: refreshTokenFor(user.id.toString(), tenant.id.toString()),
    })

    expect(result.isRight() && Object.keys(result.value)).toEqual([
      'accessToken',
    ])
  })

  it('should use the current role from the database', async () => {
    const { tenant, user } = setup()
    user.role = 'ADMIN'

    const result = await sut.execute({
      refreshToken: refreshTokenFor(user.id.toString(), tenant.id.toString()),
    })

    expect(result.isRight() && JSON.parse(result.value.accessToken).role).toBe(
      'ADMIN',
    )
  })

  it('should not renew with an access token', async () => {
    const { tenant, user } = setup()

    const result = await sut.execute({
      refreshToken: refreshTokenFor(
        user.id.toString(),
        tenant.id.toString(),
        'access',
      ),
    })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('should not renew with a token that cannot be read', async () => {
    setup()

    const result = await sut.execute({ refreshToken: 'not-a-token' })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('should not renew for a deactivated user', async () => {
    const { tenant, user } = setup({ isActive: false })

    const result = await sut.execute({
      refreshToken: refreshTokenFor(user.id.toString(), tenant.id.toString()),
    })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('should not renew for a deactivated tenant', async () => {
    const { tenant, user } = setup({}, { isActive: false })

    const result = await sut.execute({
      refreshToken: refreshTokenFor(user.id.toString(), tenant.id.toString()),
    })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('should not renew for a user that no longer exists', async () => {
    const { tenant } = setup()

    const result = await sut.execute({
      refreshToken: refreshTokenFor(
        new UniqueEntityID().toString(),
        tenant.id.toString(),
      ),
    })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('should not renew when the token names another tenant', async () => {
    const { user } = setup()
    const otherTenant = makeTenant()
    tenantsRepository.items.push(otherTenant)

    const result = await sut.execute({
      refreshToken: refreshTokenFor(
        user.id.toString(),
        otherTenant.id.toString(),
      ),
    })

    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
  })
})
