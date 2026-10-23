import { Injectable } from '@nestjs/common'
import { TenantsRepository } from '@/domain/account/application/repositories/tenants-repository'
import { Tenant } from '@/domain/account/enterprise/entities/tenant'
import { PrismaService } from '../prisma.service'
import { PrismaTenantMapper } from '../mappers/prisma-tenant-mapper'

@Injectable()
export class PrismaTenantsRepository implements TenantsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id },
    })

    if (!tenant) {
      return null
    }

    return PrismaTenantMapper.toDomain(tenant)
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { email },
    })

    if (!tenant) {
      return null
    }

    return PrismaTenantMapper.toDomain(tenant)
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { slug },
    })

    if (!tenant) {
      return null
    }

    return PrismaTenantMapper.toDomain(tenant)
  }

  async create(tenant: Tenant): Promise<void> {
    const data = PrismaTenantMapper.toPrisma(tenant)

    await this.prisma.client.tenant.create({
      data,
    })
  }

  async save(tenant: Tenant): Promise<void> {
    const data = PrismaTenantMapper.toPrisma(tenant)

    await this.prisma.client.tenant.update({
      where: { id: data.id },
      data,
    })
  }
}
