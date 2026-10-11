import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { GetUserUseCase } from '@/domain/account/application/use-cases/get-user'
import { UserPresenter } from '../presenters/user-presenter'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

@ApiTags('Account')
@ApiBearerAuth()
@Controller('/user')
export class GetUserController {
  constructor(private getUser: GetUserUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getUser.execute({
      id: user.sub,
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
      user: UserPresenter.toHTTP(result.value.user),
    }
  }
}
