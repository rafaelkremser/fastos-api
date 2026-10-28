import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import {
  NOTICE_CHANNELS,
  RegisterCustomerNoticeUseCase,
} from '@/domain/service-order/application/use-cases/register-customer-notice'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

const registerNoticeBodySchema = z.object({
  channel: z.enum(NOTICE_CHANNELS),
  notes: z.string().trim().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(registerNoticeBodySchema)

type RegisterNoticeBodySchema = z.infer<typeof registerNoticeBodySchema>

// Whoever is at the counter tells the customer, so every role can
@ApiTags('Service Orders')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/service-orders/:id/notices')
export class RegisterCustomerNoticeController {
  constructor(private registerCustomerNotice: RegisterCustomerNoticeUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: RegisterNoticeBodySchema,
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.registerCustomerNotice.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      userId: user.sub,
      channel: body.channel,
      notes: body.notes || undefined,
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
      serviceOrder: ServiceOrderPresenter.toHTTP(result.value.serviceOrder),
    }
  }
}
