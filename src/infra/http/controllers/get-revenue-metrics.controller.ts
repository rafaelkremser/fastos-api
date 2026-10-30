import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { Roles } from '@/infra/auth/roles.decorator'
import { GetRevenueMetricsUseCase } from '@/domain/service-order/application/use-cases/get-revenue-metrics'

// What the store took in: only the owner and admins see the money
@ApiTags('Metrics')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('/metrics/revenue')
export class GetRevenueMetricsController {
  constructor(private getRevenueMetrics: GetRevenueMetricsUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getRevenueMetrics.execute({
      tenantId: user.tenantId,
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException()
    }

    return { metrics: result.value.metrics }
  }
}
