import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { EditDeviceUseCase } from '@/domain/device/application/use-cases/edit-device'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { DevicePresenter } from '../presenters/device-presenter'

const editDeviceBodySchema = z.object({
  type: z.string().min(1),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  imei: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const bodyValidationPipe = new ZodValidationPipe(editDeviceBodySchema)

type EditDeviceBodySchema = z.infer<typeof editDeviceBodySchema>

@ApiTags('Devices')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/devices/:id')
export class EditDeviceController {
  constructor(private editDevice: EditDeviceUseCase) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: EditDeviceBodySchema,
    @Param('id') deviceId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.editDevice.execute({
      tenantId: user.tenantId,
      deviceId,
      type: body.type,
      brand: body.brand,
      model: body.model,
      serialNumber: body.serialNumber,
      imei: body.imei,
      color: body.color,
      condition: body.condition,
      accessories: body.accessories,
      notes: body.notes,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      device: DevicePresenter.toHTTP(result.value.device),
    }
  }
}
