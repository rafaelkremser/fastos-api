import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Public } from '@/infra/auth/public'
import { LOGIN_RATE_LIMIT } from '../rate-limit'
import { AuthenticateUserUseCase } from '@/domain/account/application/use-cases/authenticate-user'
import { WrongCredentialsError } from '@/domain/account/application/use-cases/errors/wrong-credentials-error'
import { ACCESS_TOKEN_TTL_SECONDS } from '@/domain/account/application/cryptography/tokens'

const authenticateBodySchema = z.object({
  tenantSlug: z.string().trim().toLowerCase().min(1),
  email: z.string().email(),
  password: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(authenticateBodySchema)

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@ApiTags('Account')
@Controller('/authenticate')
@Public()
@UseGuards(ThrottlerGuard)
@Throttle(LOGIN_RATE_LIMIT)
export class AuthenticateController {
  constructor(private authenticateUser: AuthenticateUserUseCase) {}

  @Post()
  @HttpCode(200)
  async handle(@Body(bodyValidationPipe) body: AuthenticateBodySchema) {
    const { tenantSlug, email, password } = body

    const result = await this.authenticateUser.execute({
      tenantSlug,
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { accessToken, refreshToken } = result.value

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
    }
  }
}
