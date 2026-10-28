import { Injectable } from '@nestjs/common'
import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from '@/core/repositories/pagination-params'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'
import { Device } from '@/domain/device/enterprise/entities/device'
import { PrismaService } from '../prisma.service'
import { PrismaDeviceMapper } from '../mappers/prisma-device-mapper'

@Injectable()
export class PrismaDevicesRepository implements DevicesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Device | null> {
    const device = await this.prisma.client.device.findUnique({
      where: { id },
    })

    if (!device) {
      return null
    }

    return PrismaDeviceMapper.toDomain(device)
  }

  async findManyByCustomerId(
    tenantId: string,
    customerId: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ): Promise<Device[]> {
    const devices = await this.prisma.client.device.findMany({
      where: {
        tenantId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return devices.map(PrismaDeviceMapper.toDomain)
  }

  async countByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<number> {
    return this.prisma.client.device.count({
      where: {
        tenantId,
        customerId,
      },
    })
  }

  async findMany(
    tenantId: string,
    { page, perPage = DEFAULT_PER_PAGE }: PaginationParams,
  ): Promise<Device[]> {
    const devices = await this.prisma.client.device.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return devices.map(PrismaDeviceMapper.toDomain)
  }

  async create(device: Device): Promise<void> {
    const data = PrismaDeviceMapper.toPrisma(device)

    await this.prisma.client.device.create({
      data,
    })
  }

  async save(device: Device): Promise<void> {
    const data = PrismaDeviceMapper.toPrisma(device)

    await this.prisma.client.device.update({
      where: { id: data.id },
      data,
    })
  }

  async delete(device: Device): Promise<void> {
    await this.prisma.client.device.delete({
      where: { id: device.id.toString() },
    })
  }
}
