import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'
import { Customer } from '@/domain/customer/enterprise/entities/customer'

export class InMemoryCustomersRepository implements CustomersRepository {
  public items: Customer[] = []

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByPhone(tenantId: string, phone: string) {
    return (
      this.items.find(
        (item) => item.tenantId.toString() === tenantId && item.phone === phone,
      ) ?? null
    )
  }

  async findMany(
    tenantId: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async searchByName(
    tenantId: string,
    name: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ) {
    return this.withNameContaining(tenantId, name)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice((page - 1) * perPage, page * perPage)
  }

  async countByTenantId(tenantId: string) {
    return this.items.filter((item) => item.tenantId.toString() === tenantId)
      .length
  }

  async countByName(tenantId: string, name: string) {
    return this.withNameContaining(tenantId, name).length
  }

  private withNameContaining(tenantId: string, name: string) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .filter((item) => item.name.toLowerCase().includes(name.toLowerCase()))
  }

  async create(customer: Customer) {
    this.items.push(customer)
  }

  async save(customer: Customer) {
    const index = this.items.findIndex((item) => item.id.equals(customer.id))
    this.items[index] = customer
  }

  async delete(customer: Customer) {
    this.items = this.items.filter((item) => !item.id.equals(customer.id))
  }
}
