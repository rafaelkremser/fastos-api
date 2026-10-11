import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { FetchDevicesByCustomerUseCase } from '@/domain/device/application/use-cases/fetch-devices-by-customer'
import { DevicePresenter } from '../presenters/device-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('/customers/:customerId/devices')
export class FetchDevicesByCustomerController {
  constructor(private fetchDevicesByCustomer: FetchDevicesByCustomerUseCase) {}

  @Get()
  async handle(
    @Param('customerId') customerId: string,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchDevicesByCustomer.execute({
      tenantId: user.tenantId,
      customerId,
      page,
    })

    if (result.isLeft()) {
      return { devices: [] }
    }

    const devices = result.value.devices

    return {
      devices: devices.map(DevicePresenter.toHTTP),
    }
  }
}
