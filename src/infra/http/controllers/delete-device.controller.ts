import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteDeviceUseCase } from '@/domain/device/application/use-cases/delete-device'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('/devices/:id')
export class DeleteDeviceController {
  constructor(private deleteDevice: DeleteDeviceUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Param('id') deviceId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteDevice.execute({
      tenantId: user.tenantId,
      deviceId,
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
  }
}
