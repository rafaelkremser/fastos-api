import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { Roles } from '@/infra/auth/roles.decorator'
import { GetTechnicianMetricsUseCase } from '@/domain/service-order/application/use-cases/get-technician-metrics'

// Each technician's orders and revenue: only the owner and admins see it,
// and a technician does not see even their own
@ApiTags('Metrics')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('/metrics/technicians')
export class GetTechnicianMetricsController {
  constructor(private getTechnicianMetrics: GetTechnicianMetricsUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getTechnicianMetrics.execute({
      tenantId: user.tenantId,
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException()
    }

    return { metrics: result.value.metrics }
  }
}
