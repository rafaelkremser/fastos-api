import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { CreateDeviceUseCase } from '@/domain/device/application/use-cases/create-device'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { DevicePresenter } from '../presenters/device-presenter'

const createDeviceBodySchema = z.object({
  customerId: z.string().uuid(),
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

const bodyValidationPipe = new ZodValidationPipe(createDeviceBodySchema)

type CreateDeviceBodySchema = z.infer<typeof createDeviceBodySchema>

@Controller('/devices')
export class CreateDeviceController {
  constructor(private createDevice: CreateDeviceUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: CreateDeviceBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.createDevice.execute({
      tenantId: user.tenantId,
      customerId: body.customerId,
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
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      device: DevicePresenter.toHTTP(result.value.device),
    }
  }
}
