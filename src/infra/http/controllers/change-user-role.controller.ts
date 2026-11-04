import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { Roles } from '@/infra/auth/roles.decorator'
import { ChangeUserRoleUseCase } from '@/domain/account/application/use-cases/change-user-role'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { UserPresenter } from '../presenters/user-presenter'

// Nobody becomes a second owner
const changeUserRoleBodySchema = z.object({
  role: z.enum(['ADMIN', 'TECHNICIAN', 'RECEPTIONIST']),
})

const bodyValidationPipe = new ZodValidationPipe(changeUserRoleBodySchema)

type ChangeUserRoleBodySchema = z.infer<typeof changeUserRoleBodySchema>

@ApiTags('Account')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('/users/:id/role')
export class ChangeUserRoleController {
  constructor(private changeUserRole: ChangeUserRoleUseCase) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: ChangeUserRoleBodySchema,
    @Param('id') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.changeUserRole.execute({
      tenantId: user.tenantId,
      managerId: user.sub,
      userId,
      role: body.role,
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
      user: UserPresenter.toHTTP(result.value.user),
    }
  }
}
