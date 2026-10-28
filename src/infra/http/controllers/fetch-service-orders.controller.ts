import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { FetchServiceOrdersUseCase } from '@/domain/service-order/application/use-cases/fetch-service-orders'
import { ORDER_STATUSES } from '@/domain/service-order/enterprise/entities/service-order'
import { ServiceOrderSummaryPresenter } from '../presenters/service-order-summary-presenter'
import { PaginationPresenter } from '../presenters/pagination-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

// An unknown status would reach the database and fail there
const statusQueryParamSchema = z.enum(ORDER_STATUSES).optional()

const statusValidationPipe = new ZodValidationPipe(statusQueryParamSchema)

type StatusQueryParamSchema = z.infer<typeof statusQueryParamSchema>

const numberQueryParamSchema = z.coerce.number().int().min(1).optional()

const numberValidationPipe = new ZodValidationPipe(numberQueryParamSchema)

type NumberQueryParamSchema = z.infer<typeof numberQueryParamSchema>

const needsNoticeQueryParamSchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true')

const needsNoticeValidationPipe = new ZodValidationPipe(
  needsNoticeQueryParamSchema,
)

type NeedsNoticeQueryParamSchema = z.infer<typeof needsNoticeQueryParamSchema>

@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/service-orders')
export class FetchServiceOrdersController {
  constructor(private fetchServiceOrders: FetchServiceOrdersUseCase) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Query('number', numberValidationPipe) number: NumberQueryParamSchema,
    @Query('status', statusValidationPipe) status: StatusQueryParamSchema,
    @Query('technicianId') technicianId: string | undefined,
    @Query('customerId') customerId: string | undefined,
    @Query('needsCustomerNotice', needsNoticeValidationPipe)
    needsCustomerNotice: NeedsNoticeQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchServiceOrders.execute({
      tenantId: user.tenantId,
      page,
      number,
      status,
      technicianId,
      customerId,
      needsCustomerNotice,
    })

    if (result.isLeft()) {
      return { serviceOrders: [], meta: PaginationPresenter.toHTTP(page, 0) }
    }

    const { serviceOrders, totalCount } = result.value

    return {
      serviceOrders: serviceOrders.map(ServiceOrderSummaryPresenter.toHTTP),
      meta: PaginationPresenter.toHTTP(page, totalCount),
    }
  }
}
