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
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { AssignTechnicianUseCase } from '@/domain/service-order/application/use-cases/assign-technician'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrderPresenter } from '../presenters/service-order-presenter'

const assignTechnicianBodySchema = z.object({
  technicianId: z.string().uuid(),
})

const bodyValidationPipe = new ZodValidationPipe(assignTechnicianBodySchema)

type AssignTechnicianBodySchema = z.infer<typeof assignTechnicianBodySchema>

@Controller('/service-orders/:id/technician')
export class AssignTechnicianController {
  constructor(private assignTechnician: AssignTechnicianUseCase) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: AssignTechnicianBodySchema,
    @Param('id') serviceOrderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const { technicianId } = body

    const result = await this.assignTechnician.execute({
      tenantId: user.tenantId,
      serviceOrderId,
      technicianId,
      assignedById: user.sub,
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
