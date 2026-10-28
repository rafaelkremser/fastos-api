import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { makeTenant } from 'test/factories/make-tenant'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { FetchInactiveTenantsUseCase } from './fetch-inactive-tenants'

let tenantsRepository: InMemoryTenantsRepository
let sut: FetchInactiveTenantsUseCase

describe('Fetch Inactive Tenants', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository()
    sut = new FetchInactiveTenantsUseCase(tenantsRepository)
  })

  it('should list the inactive tenants, oldest first', async () => {
    tenantsRepository.items.push(
      makeTenant({
        slug: Slug.create('nova'),
        isActive: false,
        createdAt: new Date('2026-10-27T12:00:00Z'),
      }),
      makeTenant({ slug: Slug.create('ativa') }),
      makeTenant({
        slug: Slug.create('antiga'),
        isActive: false,
        createdAt: new Date('2026-10-26T12:00:00Z'),
      }),
    )

    const result = await sut.execute()

    expect(result.value?.tenants.map((tenant) => tenant.slug.value)).toEqual([
      'antiga',
      'nova',
    ])
  })
})
