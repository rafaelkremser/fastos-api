import {
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
import { RefreshAccessTokenUseCase } from '@/domain/account/application/use-cases/refresh-access-token'
import { ACCESS_TOKEN_TTL_SECONDS } from '@/domain/account/application/cryptography/tokens'
import { REFRESH_RATE_LIMIT } from '../rate-limit'

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
})

const bodyValidationPipe = new ZodValidationPipe(refreshBodySchema)

type RefreshBodySchema = z.infer<typeof refreshBodySchema>

@ApiTags('Account')
@Controller('/refresh')
@Public()
@UseGuards(ThrottlerGuard)
@Throttle(REFRESH_RATE_LIMIT)
export class RefreshAccessTokenController {
  constructor(private refreshAccessToken: RefreshAccessTokenUseCase) {}

  @Post()
  @HttpCode(200)
  async handle(@Body(bodyValidationPipe) body: RefreshBodySchema) {
    const result = await this.refreshAccessToken.execute({
      refreshToken: body.refreshToken,
    })

    if (result.isLeft()) {
      throw new UnauthorizedException(result.value.message)
    }

    return {
      access_token: result.value.accessToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
    }
  }
}
