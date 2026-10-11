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
import { DeleteCustomerUseCase } from '@/domain/customer/application/use-cases/delete-customer'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('/customers/:id')
export class DeleteCustomerController {
  constructor(private deleteCustomer: DeleteCustomerUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Param('id') customerId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteCustomer.execute({
      tenantId: user.tenantId,
      customerId,
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
