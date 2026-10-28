import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { FetchCustomersUseCase } from '@/domain/customer/application/use-cases/fetch-customers'
import { CustomerPresenter } from '../presenters/customer-presenter'
import { PaginationPresenter } from '../presenters/pagination-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@ApiTags('Customers')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/customers')
export class FetchCustomersController {
  constructor(private fetchCustomers: FetchCustomersUseCase) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Query('search') search: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchCustomers.execute({
      tenantId: user.tenantId,
      page,
      search,
    })

    if (result.isLeft()) {
      return { customers: [], meta: PaginationPresenter.toHTTP(page, 0) }
    }

    const { customers, totalCount } = result.value

    return {
      customers: customers.map(CustomerPresenter.toHTTP),
      meta: PaginationPresenter.toHTTP(page, totalCount),
    }
  }
}
