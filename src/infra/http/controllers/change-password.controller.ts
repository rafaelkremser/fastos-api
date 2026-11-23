import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { LOGIN_RATE_LIMIT } from '../rate-limit'
import { ChangePasswordUseCase } from '@/domain/account/application/use-cases/change-password'
import { WrongCredentialsError } from '@/domain/account/application/use-cases/errors/wrong-credentials-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

// The same minimum as when someone is added to the team
const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

const bodyValidationPipe = new ZodValidationPipe(changePasswordBodySchema)

type ChangePasswordBodySchema = z.infer<typeof changePasswordBodySchema>

// A wrong current password is a 403, not a 401: to the frontend a 401 means
// an expired token, which it would refresh and try again. Limited like the
// sign-in, so a stolen session cannot be used to guess the password
@ApiTags('Account')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/user/password')
@UseGuards(ThrottlerGuard)
@Throttle(LOGIN_RATE_LIMIT)
export class ChangePasswordController {
  constructor(private changePassword: ChangePasswordUseCase) {}

  @Patch()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: ChangePasswordBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.changePassword.execute({
      userId: user.sub,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
