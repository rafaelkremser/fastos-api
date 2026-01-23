import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Device } from '../../enterprise/entities/device'
import { DevicesRepository } from '../repositories/devices-repository'

interface EditDeviceUseCaseRequest {
  tenantId: string
  deviceId: string
  type: string
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  imei?: string | null
  color?: string | null
  condition?: string | null
  accessories?: string | null
  notes?: string | null
}

type EditDeviceUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    device: Device
  }
>

@Injectable()
export class EditDeviceUseCase {
  constructor(private devicesRepository: DevicesRepository) {}

  async execute({
    tenantId,
    deviceId,
    type,
    brand,
    model,
    serialNumber,
    imei,
    color,
    condition,
    accessories,
    notes,
  }: EditDeviceUseCaseRequest): Promise<EditDeviceUseCaseResponse> {
    const device = await this.devicesRepository.findById(deviceId)

    if (!device) {
      return left(new ResourceNotFoundError())
    }

    if (device.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    device.type = type
    device.brand = brand ?? null
    device.model = model ?? null
    device.serialNumber = serialNumber ?? null
    device.imei = imei ?? null
    device.color = color ?? null
    device.condition = condition ?? null
    device.accessories = accessories ?? null
    device.notes = notes ?? null

    await this.devicesRepository.save(device)

    return right({
      device,
    })
  }
}
