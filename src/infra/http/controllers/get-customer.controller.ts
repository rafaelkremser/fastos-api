import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { GetCustomerUseCase } from '@/domain/customer/application/use-cases/get-customer'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CustomerPresenter } from '../presenters/customer-presenter'

@Controller('/customers/:id')
export class GetCustomerController {
  constructor(private getCustomer: GetCustomerUseCase) {}

  @Get()
  async handle(
    @Param('id') customerId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.getCustomer.execute({
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

    return {
      customer: CustomerPresenter.toHTTP(result.value.customer),
    }
  }
}
