import { Prisma, Tenant as PrismaTenant } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tenant } from '@/domain/account/enterprise/entities/tenant'

export class PrismaTenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.create(
      {
        name: raw.name,
        document: raw.document,
        email: raw.email,
        phone: raw.phone,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(tenant: Tenant): Prisma.TenantUncheckedCreateInput {
    return {
      id: tenant.id.toString(),
      name: tenant.name,
      document: tenant.document,
      email: tenant.email,
      phone: tenant.phone,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }
  }
}
