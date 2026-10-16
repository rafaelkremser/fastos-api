import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { GetServiceOrderUseCase } from '@/domain/service-order/application/use-cases/get-service-order'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/service-orders/:id')
export class GetServiceOrderController {
  constructor(private getServiceOrder: GetServiceOrderUseCase) {}

  @Get()
  async handle(
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.getServiceOrder.execute({
      tenantId: user.tenantId,
      serviceOrderId,
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
