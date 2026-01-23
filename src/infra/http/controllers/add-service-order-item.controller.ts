import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { AddServiceOrderItemUseCase } from '@/domain/service-order/application/use-cases/add-service-order-item'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderItemPresenter } from '../presenters/service-order-item-presenter'

const addItemBodySchema = z.object({
  type: z.enum(['SERVICE', 'PART', 'OTHER']),
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
})

const bodyValidationPipe = new ZodValidationPipe(addItemBodySchema)

type AddItemBodySchema = z.infer<typeof addItemBodySchema>

@Controller('/service-orders/:id/items')
export class AddServiceOrderItemController {
  constructor(private addServiceOrderItem: AddServiceOrderItemUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: AddItemBodySchema,
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.addServiceOrderItem.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      type: body.type,
      description: body.description,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
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
      item: ServiceOrderItemPresenter.toHTTP(result.value.item),
    }
  }
}
