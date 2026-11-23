import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { makeTenant } from 'test/factories/make-tenant'
import { makeUser } from 'test/factories/make-user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { ResetPasswordUseCase } from './reset-password'

let tenantsRepository: InMemoryTenantsRepository
let usersRepository: InMemoryUsersRepository
let sut: ResetPasswordUseCase

describe('Reset Password', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new ResetPasswordUseCase(
      tenantsRepository,
      usersRepository,
      new FakeHasher(),
    )
  })

  it('should set a new password for someone in the store', async () => {
    const tenant = makeTenant({ slug: Slug.create('loja-a') })
    const user = makeUser({ tenantId: tenant.id, email: 'ana@loja.com' })
    tenantsRepository.items.push(tenant)
    usersRepository.items.push(user)

    const result = await sut.execute({
      tenantSlug: 'loja-a',
      email: 'ana@loja.com',
      newPassword: 'temporaria',
    })

    expect(result.isRight()).toBe(true)
    expect(user.password).toBe('temporaria-hashed')
  })

  it('should only find the person in the store given', async () => {
    const storeA = makeTenant({ slug: Slug.create('loja-a') })
    const storeB = makeTenant({ slug: Slug.create('loja-b') })
    const user = makeUser({ tenantId: storeA.id, email: 'ana@loja.com' })
    tenantsRepository.items.push(storeA, storeB)
    usersRepository.items.push(user)

    const wrongStore = await sut.execute({
      tenantSlug: 'loja-b',
      email: 'ana@loja.com',
      newPassword: 'temporaria',
    })
    const noStore = await sut.execute({
      tenantSlug: 'nao-existe',
      email: 'ana@loja.com',
      newPassword: 'temporaria',
    })

    expect(wrongStore.value).toBeInstanceOf(ResourceNotFoundError)
    expect(noStore.value).toBeInstanceOf(ResourceNotFoundError)
    expect(user.password).toBe('password-hashed')
  })
})
