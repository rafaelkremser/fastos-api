import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Device, DeviceProps } from '@/domain/device/enterprise/entities/device'

export function makeDevice(
  override: Partial<DeviceProps> = {},
  id?: UniqueEntityID,
) {
  return Device.create(
    {
      tenantId: new UniqueEntityID(),
      customerId: new UniqueEntityID(),
      type: 'SMARTPHONE',
      brand: null,
      model: null,
      serialNumber: null,
      imei: null,
      color: null,
      condition: null,
      accessories: null,
      notes: null,
      ...override,
    },
    id,
  )
}
