import { randomUUID } from 'node:crypto'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Tenant,
  TenantProps,
} from '@/domain/account/enterprise/entities/tenant'
import { Slug } from '@/domain/account/enterprise/entities/value-objects/slug'

export function makeTenant(
  override: Partial<TenantProps> = {},
  id?: UniqueEntityID,
) {
  const suffix = randomUUID().slice(0, 8)

  return Tenant.create(
    {
      name: `Tenant ${suffix}`,
      slug: Slug.create(`tenant-${suffix}`),
      email: `tenant-${suffix}@example.com`,
      document: null,
      phone: null,
      ...override,
    },
    id,
  )
}
