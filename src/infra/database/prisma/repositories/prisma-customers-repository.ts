import { Injectable } from '@nestjs/common'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'
import { Customer } from '@/domain/customer/enterprise/entities/customer'
import { PrismaService } from '../prisma.service'
import { PrismaCustomerMapper } from '../mappers/prisma-customer-mapper'

@Injectable()
export class PrismaCustomersRepository implements CustomersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return null
    }

    return PrismaCustomerMapper.toDomain(customer)
  }

  async findByPhone(tenantId: string, phone: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        phone,
      },
    })

    if (!customer) {
      return null
    }

    return PrismaCustomerMapper.toDomain(customer)
  }

  async findMany(
    tenantId: string,
    { page, perPage = 20 }: PaginationParams,
  ): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return customers.map(PrismaCustomerMapper.toDomain)
  }

  async searchByName(
    tenantId: string,
    name: string,
    { page, perPage = 20 }: PaginationParams,
  ): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return customers.map(PrismaCustomerMapper.toDomain)
  }

  async countByTenantId(tenantId: string): Promise<number> {
    return this.prisma.customer.count({
      where: { tenantId },
    })
  }

  async create(customer: Customer): Promise<void> {
    const data = PrismaCustomerMapper.toPrisma(customer)

    await this.prisma.customer.create({
      data,
    })
  }

  async save(customer: Customer): Promise<void> {
    const data = PrismaCustomerMapper.toPrisma(customer)

    await this.prisma.customer.update({
      where: { id: data.id },
      data,
    })
  }

  async delete(customer: Customer): Promise<void> {
    await this.prisma.customer.delete({
      where: { id: customer.id.toString() },
    })
  }
}
