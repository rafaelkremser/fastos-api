import { Tenant } from '../../enterprise/entities/tenant'

export abstract class TenantsRepository {
  abstract findById(id: string): Promise<Tenant | null>
  abstract findByEmail(email: string): Promise<Tenant | null>
  abstract findBySlug(slug: string): Promise<Tenant | null>
  // Oldest first, so tenants waiting for approval are seen in order
  abstract findManyInactive(): Promise<Tenant[]>
  abstract create(tenant: Tenant): Promise<void>
  abstract save(tenant: Tenant): Promise<void>
}
