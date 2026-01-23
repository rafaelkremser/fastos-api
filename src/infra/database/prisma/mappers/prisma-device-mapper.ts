import { Prisma, Device as PrismaDevice } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Device } from '@/domain/device/enterprise/entities/device'

export class PrismaDeviceMapper {
  static toDomain(raw: PrismaDevice): Device {
    return Device.create(
      {
        tenantId: new UniqueEntityID(raw.tenantId),
        customerId: new UniqueEntityID(raw.customerId),
        type: raw.type,
        brand: raw.brand,
        model: raw.model,
        serialNumber: raw.serialNumber,
        imei: raw.imei,
        color: raw.color,
        condition: raw.condition,
        accessories: raw.accessories,
        notes: raw.notes,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(device: Device): Prisma.DeviceUncheckedCreateInput {
    return {
      id: device.id.toString(),
      tenantId: device.tenantId.toString(),
      customerId: device.customerId.toString(),
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      imei: device.imei,
      color: device.color,
      condition: device.condition,
      accessories: device.accessories,
      notes: device.notes,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    }
  }
}
