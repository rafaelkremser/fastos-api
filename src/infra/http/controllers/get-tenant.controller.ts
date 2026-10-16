import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { GetTenantUseCase } from '@/domain/account/application/use-cases/get-tenant'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { TenantPresenter } from '../presenters/tenant-presenter'

@ApiTags('Account')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/tenant')
export class GetTenantController {
  constructor(private getTenant: GetTenantUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
  ) {
    if(!user.tenantId){
      throw new BadRequestException('User does not belong to any tenant.')
    }

    const result = await this.getTenant.execute({
      id: user.tenantId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error.constructor === ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      } else {
        throw new BadRequestException(error.message)
      }
    }

    return {
      tenant: TenantPresenter.toHTTP(result.value.tenant),
    }
  }
}
