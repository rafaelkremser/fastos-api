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
import { SetUserActiveUseCase } from '@/domain/account/application/use-cases/set-user-active'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { UserPresenter } from '../presenters/user-presenter'

const setUserActiveBodySchema = z.object({
  isActive: z.boolean(),
})

const bodyValidationPipe = new ZodValidationPipe(setUserActiveBodySchema)

type SetUserActiveBodySchema = z.infer<typeof setUserActiveBodySchema>

@ApiTags('Account')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('/users/:id/active')
export class SetUserActiveController {
  constructor(private setUserActive: SetUserActiveUseCase) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: SetUserActiveBodySchema,
    @Param('id') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.setUserActive.execute({
      tenantId: user.tenantId,
      managerId: user.sub,
      userId,
      isActive: body.isActive,
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
