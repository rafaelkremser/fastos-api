import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { Roles } from '@/infra/auth/roles.decorator'
import { GetStageTimesUseCase } from '@/domain/service-order/application/use-cases/get-stage-times'

// How long orders stay in each stage, for the whole store and never per
// person. Only the owner and admins see it
@ApiTags('Metrics')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('/metrics/stage-times')
export class GetStageTimesController {
  constructor(private getStageTimes: GetStageTimesUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getStageTimes.execute({
      tenantId: user.tenantId,
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException()
    }

    return { stages: result.value.stages }
  }
}
