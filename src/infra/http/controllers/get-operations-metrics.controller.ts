import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { GetOperationsMetricsUseCase } from '@/domain/service-order/application/use-cases/get-operations-metrics'

// Orders by status, late and waiting for a notice: the day-to-day of every
// role. The money is in /metrics/revenue
@ApiTags('Metrics')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/metrics/operations')
export class GetOperationsMetricsController {
  constructor(private getOperationsMetrics: GetOperationsMetricsUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getOperationsMetrics.execute({
      tenantId: user.tenantId,
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException()
    }

    return { metrics: result.value.metrics }
  }
}
