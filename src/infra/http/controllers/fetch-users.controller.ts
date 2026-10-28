import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { FetchUsersUseCase } from '@/domain/account/application/use-cases/fetch-users'
import { USER_ROLES } from '@/domain/account/enterprise/entities/user'
import { UserPresenter } from '../presenters/user-presenter'

const roleQueryParamSchema = z.enum(USER_ROLES).optional()

const roleValidationPipe = new ZodValidationPipe(roleQueryParamSchema)

type RoleQueryParamSchema = z.infer<typeof roleQueryParamSchema>

// Everyone sees the team: the service order list filters by technician for
// every role. Only the owner and admins create users
@ApiTags('Account')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/users')
export class FetchUsersController {
  constructor(private fetchUsers: FetchUsersUseCase) {}

  @Get()
  async handle(
    @Query('role', roleValidationPipe) role: RoleQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.fetchUsers.execute({
      tenantId: user.tenantId,
      role,
    })

    if (result.isLeft()) {
      return { users: [] }
    }

    return {
      users: result.value.users.map(UserPresenter.toHTTP),
    }
  }
}
