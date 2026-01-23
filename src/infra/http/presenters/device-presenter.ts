import { Device } from '@/domain/device/enterprise/entities/device'

export class DevicePresenter {
  static toHTTP(device: Device) {
    return {
      id: device.id.toString(),
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
      fullDescription: device.fullDescription,
      createdAt: device.createdAt,
    }
  }
}
