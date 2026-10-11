import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ChangeServiceOrderStatusUseCase } from '@/domain/service-order/application/use-cases/change-service-order-status'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

const changeStatusBodySchema = z.object({
  status: z.enum([
    'OPEN',
    'IN_ANALYSIS',
    'WAITING_APPROVAL',
    'APPROVED',
    'IN_PROGRESS',
    'WAITING_PARTS',
    'COMPLETED',
    'DELIVERED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(changeStatusBodySchema)

type ChangeStatusBodySchema = z.infer<typeof changeStatusBodySchema>

@ApiTags('Service Orders')
@ApiBearerAuth()
@Controller('/service-orders/:id/status')
export class ChangeServiceOrderStatusController {
  constructor(
    private changeServiceOrderStatus: ChangeServiceOrderStatusUseCase,
  ) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: ChangeStatusBodySchema,
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const { status, notes } = body

    const result = await this.changeServiceOrderStatus.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      userId: user.sub,
      newStatus: status,
      notes,
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
