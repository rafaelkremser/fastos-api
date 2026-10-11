import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { CreateCustomerUseCase } from '@/domain/customer/application/use-cases/create-customer'
import { CustomerAlreadyExistsError } from '@/domain/customer/application/use-cases/errors/customer-already-exists-error'
import { CustomerPresenter } from '../presenters/customer-presenter'

const createCustomerBodySchema = z.object({
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

const bodyValidationPipe = new ZodValidationPipe(createCustomerBodySchema)

type CreateCustomerBodySchema = z.infer<typeof createCustomerBodySchema>

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('/customers')
export class CreateCustomerController {
  constructor(private createCustomer: CreateCustomerUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(bodyValidationPipe) body: CreateCustomerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.createCustomer.execute({
      tenantId: user.tenantId,
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
        case CustomerAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      customer: CustomerPresenter.toHTTP(result.value.customer),
    }
  }
}
