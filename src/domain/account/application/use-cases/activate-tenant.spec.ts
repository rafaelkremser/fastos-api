import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { makeTenant } from 'test/factories/make-tenant'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { ActivateTenantUseCase } from './activate-tenant'

let tenantsRepository: InMemoryTenantsRepository
let sut: ActivateTenantUseCase

describe('Activate Tenant', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    sut = new ActivateTenantUseCase(tenantsRepository)
  })

  it('should activate a tenant by its slug', async () => {
    tenantsRepository.items.push(
      makeTenant({ slug: Slug.create('loja-a'), isActive: false }),
    )

    const result = await sut.execute({ slug: 'loja-a' })

    expect(result.isRight()).toBe(true)
    expect(tenantsRepository.items[0].isActive).toBe(true)
  })

  it('should not activate a tenant that does not exist', async () => {
    const result = await sut.execute({ slug: 'nao-existe' })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
