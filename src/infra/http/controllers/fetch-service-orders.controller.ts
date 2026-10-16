import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { FetchServiceOrdersUseCase } from '@/domain/service-order/application/use-cases/fetch-service-orders'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

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
@Controller('/service-orders')
export class FetchServiceOrdersController {
  constructor(private fetchServiceOrders: FetchServiceOrdersUseCase) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Query('status') status: string | undefined,
    @Query('technicianId') technicianId: string | undefined,
    @Query('customerId') customerId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchServiceOrders.execute({
      tenantId: user.tenantId,
      page,
      status,
      technicianId,
      customerId,
    })

    if (result.isLeft()) {
      return { serviceOrders: [] }
    }

    const serviceOrders = result.value.serviceOrders

    return {
      serviceOrders: serviceOrders.map(ServiceOrderPresenter.toHTTP),
    }
  }
}
