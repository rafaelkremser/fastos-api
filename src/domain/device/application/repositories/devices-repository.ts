import { PaginationParams } from '@/core/repositories/pagination-params'
import { Device } from '../../enterprise/entities/device'

export abstract class DevicesRepository {
  abstract findById(id: string): Promise<Device | null>
  abstract findManyByCustomerId(
    tenantId: string,
    customerId: string,
    params: PaginationParams,
  ): Promise<Device[]>
  abstract findMany(
    tenantId: string,
    params: PaginationParams,
  ): Promise<Device[]>
  abstract create(device: Device): Promise<void>
  abstract save(device: Device): Promise<void>
  abstract delete(device: Device): Promise<void>
}
