import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { CreateServiceOrderUseCase } from '@/domain/service-order/application/use-cases/create-service-order'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

const createServiceOrderBodySchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  problemDescription: z.string().min(10),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  estimatedDate: z.coerce.date().optional(),
  internalNotes: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(createServiceOrderBodySchema)

type CreateServiceOrderBodySchema = z.infer<typeof createServiceOrderBodySchema>

@ApiTags('Service Orders')
@ApiBearerAuth()
@Controller('/service-orders')
export class CreateServiceOrderController {
  constructor(private createServiceOrder: CreateServiceOrderUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: CreateServiceOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.createServiceOrder.execute({
      tenantId: user.tenantId,
      createdById: user.sub,
      customerId: body.customerId,
      deviceId: body.deviceId,
      problemDescription: body.problemDescription,
      priority: body.priority,
      estimatedDate: body.estimatedDate,
      internalNotes: body.internalNotes,
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
      serviceOrder: ServiceOrderPresenter.toHTTP(result.value.serviceOrder),
    }
  }
}
