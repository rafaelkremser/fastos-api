import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { RemoveServiceOrderItemUseCase } from '@/domain/service-order/application/use-cases/remove-service-order-item'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

@ApiTags('Service Orders')
@ApiBearerAuth()
@Controller('/service-orders/:serviceOrderId/items/:itemId')
export class RemoveServiceOrderItemController {
  constructor(private removeServiceOrderItem: RemoveServiceOrderItemUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.removeServiceOrderItem.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      itemId,
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
  }
}
