import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ALL_ROLES, Roles } from '@/infra/auth/roles.decorator'
import { EditCustomerUseCase } from '@/domain/customer/application/use-cases/edit-customer'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CustomerPresenter } from '../presenters/customer-presenter'

const editCustomerBodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  document: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const bodyValidationPipe = new ZodValidationPipe(editCustomerBodySchema)

type EditCustomerBodySchema = z.infer<typeof editCustomerBodySchema>

@ApiTags('Customers')
@ApiBearerAuth()
@Roles(...ALL_ROLES)
@Controller('/customers/:id')
export class EditCustomerController {
  constructor(private editCustomer: EditCustomerUseCase) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: EditCustomerBodySchema,
    @Param('id') customerId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.editCustomer.execute({
      tenantId: user.tenantId,
      customerId,
      name: body.name,
      phone: body.phone,
      document: body.document,
      email: body.email,
      phone2: body.phone2,
      address: body.address,
      addressNumber: body.addressNumber,
      complement: body.complement,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      notes: body.notes,
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
