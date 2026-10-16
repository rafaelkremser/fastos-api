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
import { Roles } from '@/infra/auth/roles.decorator'
import { EditServiceOrderUseCase } from '@/domain/service-order/application/use-cases/edit-service-order'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

const editServiceOrderBodySchema = z.object({
  problemDescription: z.string().min(10).optional(),
  diagnosis: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  technicianId: z.string().uuid().optional().nullable(),
  estimatedDate: z.coerce.date().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  finalCost: z.number().optional().nullable(),
  discount: z.number().optional(),
  internalNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
})

const bodyValidationPipe = new ZodValidationPipe(editServiceOrderBodySchema)

type EditServiceOrderBodySchema = z.infer<typeof editServiceOrderBodySchema>

@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN', 'TECHNICIAN')
@Controller('/service-orders/:id')
export class EditServiceOrderController {
  constructor(private editServiceOrder: EditServiceOrderUseCase) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: EditServiceOrderBodySchema,
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.editServiceOrder.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      ...body,
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
      serviceOrder: ServiceOrderPresenter.toHTTP(result.value.serviceOrder),
    }
  }
}
