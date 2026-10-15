import { TenantsRepository } from '@/domain/account/application/repositories/tenants-repository'
import { Tenant } from '@/domain/account/enterprise/entities/tenant'

export class InMemoryTenantsRepository implements TenantsRepository {
  public items: Tenant[] = []

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByEmail(email: string) {
    return this.items.find((item) => item.email === email) ?? null
  }

  async findBySlug(slug: string) {
    return this.items.find((item) => item.slug.value === slug) ?? null
  }

  async create(tenant: Tenant) {
    this.items.push(tenant)
  }

  async save(tenant: Tenant) {
    const index = this.items.findIndex((item) => item.id.equals(tenant.id))
    this.items[index] = tenant
  }
}
