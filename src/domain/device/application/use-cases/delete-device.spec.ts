import { InMemoryDevicesRepository } from 'test/repositories/in-memory-devices-repository'
import { InMemoryServiceOrdersRepository } from 'test/repositories/in-memory-service-orders-repository'
import { InMemoryServiceOrderItemsRepository } from 'test/repositories/in-memory-service-order-items-repository'
import { makeDevice } from 'test/factories/make-device'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { DeleteDeviceUseCase } from './delete-device'
import { DeviceHasServiceOrdersError } from './errors/device-has-service-orders-error'

let devicesRepository: InMemoryDevicesRepository
let serviceOrdersRepository: InMemoryServiceOrdersRepository
let sut: DeleteDeviceUseCase

describe('Delete Device', () => {
  beforeEach(() => {
    devicesRepository = new InMemoryDevicesRepository()
    serviceOrdersRepository = new InMemoryServiceOrdersRepository(
      new InMemoryServiceOrderItemsRepository(),
    )
    sut = new DeleteDeviceUseCase(devicesRepository, serviceOrdersRepository)
  })

  it('should delete a device without service orders', async () => {
    const device = makeDevice()
    devicesRepository.items.push(device)
    // An order for another device of the same customer does not matter
    serviceOrdersRepository.items.push(
      makeServiceOrder({
        tenantId: device.tenantId,
        customerId: device.customerId,
      }),
    )

    const result = await sut.execute({
      tenantId: device.tenantId.toString(),
      deviceId: device.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(devicesRepository.items).toHaveLength(0)
  })

  it('should keep a device that has service orders', async () => {
    const device = makeDevice()
    devicesRepository.items.push(device)
    serviceOrdersRepository.items.push(
      makeServiceOrder({
        tenantId: device.tenantId,
        customerId: device.customerId,
        deviceId: device.id,
      }),
    )

    const result = await sut.execute({
      tenantId: device.tenantId.toString(),
      deviceId: device.id.toString(),
    })

    expect(result.value).toBeInstanceOf(DeviceHasServiceOrdersError)
    expect(devicesRepository.items).toHaveLength(1)
  })

  it('should not delete a device from another tenant', async () => {
    const device = makeDevice()
    devicesRepository.items.push(device)

    const result = await sut.execute({
      tenantId: 'another-tenant',
      deviceId: device.id.toString(),
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(devicesRepository.items).toHaveLength(1)
  })
})
