import { PaginationParams } from '@/core/repositories/pagination-params'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'
import { Device } from '@/domain/device/enterprise/entities/device'

export class InMemoryDevicesRepository implements DevicesRepository {
  public items: Device[] = []

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findManyByCustomerId(
    tenantId: string,
    customerId: string,
    { page, perPage = 20 }: PaginationParams,
  ) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .filter((item) => item.customerId.toString() === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async findMany(tenantId: string, { page, perPage = 20 }: PaginationParams) {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * perPage, page * perPage)
  }

  async create(device: Device) {
    this.items.push(device)
  }

  async save(device: Device) {
    const index = this.items.findIndex((item) => item.id.equals(device.id))
    this.items[index] = device
  }

  async delete(device: Device) {
    this.items = this.items.filter((item) => !item.id.equals(device.id))
  }
}
