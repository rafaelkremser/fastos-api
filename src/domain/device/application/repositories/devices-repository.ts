import { PaginationParams } from '@/core/repositories/pagination-params'
import { Device } from '../../enterprise/entities/device'

export abstract class DevicesRepository {
  abstract findById(id: string): Promise<Device | null>
  abstract findManyByCustomerId(
    tenantId: string,
    customerId: string,
    params: PaginationParams,
  ): Promise<Device[]>
  abstract countByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<number>
  abstract findMany(
    tenantId: string,
    params: PaginationParams,
  ): Promise<Device[]>
  abstract create(device: Device): Promise<void>
  abstract save(device: Device): Promise<void>
  abstract delete(device: Device): Promise<void>
  abstract deleteManyByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<void>
}
