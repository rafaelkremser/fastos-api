import { PaginationParams } from '@/core/repositories/pagination-params'
import { Customer } from '../../enterprise/entities/customer'

export abstract class CustomersRepository {
  abstract findById(id: string): Promise<Customer | null>
  abstract findByPhone(tenantId: string, phone: string): Promise<Customer | null>
  abstract findMany(
    tenantId: string,
    params: PaginationParams,
  ): Promise<Customer[]>
  abstract searchByName(
    tenantId: string,
    name: string,
    params: PaginationParams,
  ): Promise<Customer[]>
  abstract countByTenantId(tenantId: string): Promise<number>
  // Counts what searchByName finds, across all pages
  abstract countByName(tenantId: string, name: string): Promise<number>
  abstract create(customer: Customer): Promise<void>
  abstract save(customer: Customer): Promise<void>
  abstract delete(customer: Customer): Promise<void>
}
