import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { Device } from '../../enterprise/entities/device'
import { DevicesRepository } from '../repositories/devices-repository'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'

interface CreateDeviceUseCaseRequest {
  tenantId: string
  customerId: string
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

type CreateDeviceUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    device: Device
  }
>

@Injectable()
export class CreateDeviceUseCase {
  constructor(
    private devicesRepository: DevicesRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute({
    tenantId,
    customerId,
    type,
    brand,
    model,
    serialNumber,
    imei,
    color,
    condition,
    accessories,
    notes,
  }: CreateDeviceUseCaseRequest): Promise<CreateDeviceUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer || customer.tenantId.toString() !== tenantId) {
      return left(new ResourceNotFoundError())
    }

    const device = Device.create({
      tenantId: new UniqueEntityID(tenantId),
      customerId: new UniqueEntityID(customerId),
      type,
      brand: brand ?? null,
      model: model ?? null,
      serialNumber: serialNumber ?? null,
      imei: imei ?? null,
      color: color ?? null,
      condition: condition ?? null,
      accessories: accessories ?? null,
      notes: notes ?? null,
    })

    await this.devicesRepository.create(device)

    return right({
      device,
    })
  }
}
