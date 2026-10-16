import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { FetchServiceOrderHistoryUseCase } from '@/domain/service-order/application/use-cases/fetch-service-order-history'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderHistoryPresenter } from '../presenters/service-order-history-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/service-orders/:id/history')
export class FetchServiceOrderHistoryController {
  constructor(
    private fetchServiceOrderHistory: FetchServiceOrderHistoryUseCase,
  ) {}

  @Get()
  async handle(
    @Param('id') serviceOrderId: string,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchServiceOrderHistory.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      page,
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
      history: result.value.history.map(ServiceOrderHistoryPresenter.toHTTP),
    }
  }
}
