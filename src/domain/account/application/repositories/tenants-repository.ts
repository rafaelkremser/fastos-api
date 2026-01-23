import { Tenant } from '../../enterprise/entities/tenant'

export abstract class TenantsRepository {
  abstract findById(id: string): Promise<Tenant | null>
  abstract findByEmail(email: string): Promise<Tenant | null>
  abstract create(tenant: Tenant): Promise<void>
  abstract save(tenant: Tenant): Promise<void>
}
