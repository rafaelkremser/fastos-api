import { Tenant } from '@/domain/account/enterprise/entities/tenant'

export class TenantPresenter {
  static toHTTP(tenant: Tenant) {
    return {
      id: tenant.id.toString(),
      name: tenant.name,
      slug: tenant.slug.value,
      email: tenant.email,
      document: tenant.document,
      phone: tenant.phone,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
    }
  }
}
